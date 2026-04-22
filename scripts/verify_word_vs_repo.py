#!/usr/bin/env python3
"""
逐项核对：从 Word 重新解析的题库 vs 仓库中 questions.generated.ts 的 JSON；
并核对报告脚注与 Word 503–505 行一致。

在项目根目录执行：python3 scripts/verify_word_vs_repo.py
失败时 exit 1 并打印差异。
"""
from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_Q = ROOT / "src/features/assessment/questions.generated.ts"
DOC = ROOT / "docs/client/智慧父母测评-v2.docx"


def load_build_module():
    path = ROOT / "scripts/build_assessment_from_docx.py"
    spec = importlib.util.spec_from_file_location("build_docx", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def extract_ts_json_array(source: str, export_name: str) -> list:
    key = f"export const {export_name}: AssessmentQuestion[] = "
    i = source.find(key)
    if i < 0:
        raise RuntimeError(f"cannot find export {export_name}")
    j = i + len(key)
    while j < len(source) and source[j] in " \t\n\r":
        j += 1
    if j >= len(source) or source[j] != "[":
        raise RuntimeError(f"no array start for {export_name} at pos {j}")
    depth = 0
    start = j
    for k in range(j, len(source)):
        if source[k] == "[":
            depth += 1
        elif source[k] == "]":
            depth -= 1
            if depth == 0:
                return json.loads(source[start : k + 1])
    raise RuntimeError(f"unclosed array for {export_name}")


def norm_text(s: str) -> str:
    """弱化标点差异：统一弯引号、空白。"""
    t = s.strip()
    t = t.replace("\u201c", '"').replace("\u201d", '"').replace("\u2018", "'").replace("\u2019", "'")
    t = re.sub(r"\s+", "", t)
    return t


def compare_questions(name: str, doc_list: list, repo_list: list) -> list[str]:
    errs: list[str] = []
    if len(doc_list) != len(repo_list):
        errs.append(f"{name}: count doc={len(doc_list)} repo={len(repo_list)}")
        return errs
    for d, r in zip(doc_list, repo_list, strict=True):
        qid = d.get("id") or r.get("id")
        if d.get("dimension") != r.get("dimension") or d.get("type") != r.get("type"):
            errs.append(
                f"{name} id={qid} dim/type doc={d.get('dimension')}/{d.get('type')} repo={r.get('dimension')}/{r.get('type')}"
            )
        if norm_text(d["text"]) != norm_text(r["text"]):
            errs.append(f"{name} id={qid} stem mismatch\ndoc: {d['text'][:120]}\nrepo:{r['text'][:120]}")
        if len(d["options"]) != len(r["options"]):
            errs.append(f"{name} id={qid} option count doc={len(d['options'])} repo={len(r['options'])}")
            continue
        for i, (opd, opr) in enumerate(zip(d["options"], r["options"], strict=True)):
            if opd["score"] != opr["score"]:
                errs.append(f"{name} id={qid} opt{i} score doc={opd['score']} repo={opr['score']}")
            if norm_text(opd["label"]) != norm_text(opr["label"]):
                errs.append(
                    f"{name} id={qid} opt{i} label mismatch\ndoc: {opd['label'][:100]}\nrepo:{opr['label'][:100]}"
                )
    return errs


def verify_word_footnotes() -> list[str]:
    import zipfile
    import xml.etree.ElementTree as ET

    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    with zipfile.ZipFile(DOC) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    paras: list[str] = []
    for p in root.findall(".//w:p", ns):
        texts = [t.text or "" for t in p.findall(".//w:t", ns)]
        s = "".join(texts).strip()
        if s:
            paras.append(s)
    w503 = paras[502] if len(paras) > 502 else ""
    w504 = paras[503] if len(paras) > 503 else ""
    w505 = paras[504] if len(paras) > 504 else ""

    rc = (ROOT / "src/features/assessment/report-word-copy.ts").read_text(encoding="utf-8")
    m1 = re.search(r'WORD_COMPETENCE_CLARIFICATION\s*=\s*"([\s\S]*?)"\s*;', rc)
    m2 = re.search(r'WORD_PERCENT_CONVERSION_NOTE\s*=\s*"([\s\S]*?)"\s*;', rc)
    repo_c = m1.group(1).replace("\\n", "\n") if m1 else ""
    repo_p = m2.group(1).replace("\\n", "\n") if m2 else ""
    errs: list[str] = []
    merged_word = f"{w503}。{w504}" if w503 and w504 else ""
    # Word 504 句末无「。」，与仓库字符串一致
    if norm_text(repo_c) != norm_text(merged_word):
        errs.append(
            f"脚注能力感句: repo与Word合并不一致\nWord503:{w503}\nWord504:{w504}\nrepo:{repo_c}"
        )
    if w505 and norm_text(repo_p) != norm_text(w505):
        errs.append(f"脚注百分制句 mismatch\nWord:{w505}\nrepo:{repo_p}")
    return errs


def main() -> int:
    mod = load_build_module()
    paras = mod.read_paras()
    split_idx = next(i for i, s in enumerate(paras) if "题目结束" in s and "生成测评报告" in s)
    chunk = paras[74:split_idx]
    core_doc, _ = mod.parse_core_block(chunk)
    tail = paras[split_idx + 1 :]
    ai = next(i for i, s in enumerate(tail) if s.startswith("家长的教育焦虑指数"))
    bi = next(i for i, s in enumerate(tail) if s.startswith("家长的养育倦怠指数"))
    ci = next(i for i, s in enumerate(tail) if s.startswith("家长的教养能力感"))
    anxiety_doc = mod.parse_index_block(tail, ai + 1, "anxiety")
    burnout_doc = mod.parse_index_block(tail, bi + 1, "burnout")
    competence_doc = mod.parse_index_block(tail, ci + 1, "competence")

    src = OUT_Q.read_text(encoding="utf-8")
    core_repo = extract_ts_json_array(src, "coreQuestions")
    anxiety_repo = extract_ts_json_array(src, "anxietyQuestions")
    burnout_repo = extract_ts_json_array(src, "burnoutQuestions")
    competence_repo = extract_ts_json_array(src, "competenceQuestions")

    all_errs: list[str] = []
    for label, a, b in [
        ("coreQuestions", core_doc, core_repo),
        ("anxietyQuestions", anxiety_doc, anxiety_repo),
        ("burnoutQuestions", burnout_doc, burnout_repo),
        ("competenceQuestions", competence_doc, competence_repo),
    ]:
        all_errs.extend(compare_questions(label, a, b))
        for d, r in zip(a, b, strict=True):
            if d.get("id") != r.get("id"):
                all_errs.append(f"{label} id order doc={d.get('id')} repo={r.get('id')}")

    try:
        all_errs.extend(verify_word_footnotes())
    except Exception as e:  # noqa: BLE001
        all_errs.append(f"footnote verify error: {e}")

    if all_errs:
        print("核对失败，共", len(all_errs), "条：")
        for e in all_errs[:80]:
            print("-", e)
        if len(all_errs) > 80:
            print("...", len(all_errs) - 80, "more")
        return 1

    print("OK: Word 解析与 questions.generated.ts 全量题干/选项/分值一致；脚注与 Word 503–505 一致。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
