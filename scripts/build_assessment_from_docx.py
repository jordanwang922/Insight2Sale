#!/usr/bin/env python3
"""
从 docs/client/智慧父母测评-v2.docx 解析题库与解析块，生成：
- src/features/assessment/questions.generated.ts
- src/features/assessment/question-details.generated.ts

运行：python3 scripts/build_assessment_from_docx.py
"""
from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

DOC = Path(__file__).resolve().parent.parent / "docs/client/智慧父母测评-v2.docx"
OUT_Q = Path(__file__).resolve().parent.parent / "src/features/assessment/questions.generated.ts"
OUT_D = Path(__file__).resolve().parent.parent / "src/features/assessment/question-details.generated.ts"

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

DIM_NUM_TO_NAME = {
    "1": "需求",
    "2": "接纳情绪",
    "3": "沟通",
    "4": "家庭系统",
    "5": "自律",
    "6": "自主",
}

# Word 内部审稿用语，家长端不展示
_REF_SCALE_RE = re.compile(r"[（(]参考量表[0-9,\d，、\s]+[）)]")


def clean_question_stem(stem: str) -> str:
    s = _REF_SCALE_RE.sub("", stem)
    return re.sub(r"\n{3,}", "\n\n", s).strip()


def read_paras() -> list[str]:
    with zipfile.ZipFile(DOC) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    paras: list[str] = []
    for p in root.findall(".//w:p", NS):
        texts = [t.text or "" for t in p.findall(".//w:t", NS)]
        s = "".join(texts).strip()
        if s:
            paras.append(s)
    return paras


def parse_inline_options(line: str, qn: int) -> tuple[str, list[dict]]:
    m = re.match(rf"^({qn})、(.+?)(?=\s*A[\.\．])", line)
    if not m:
        raise ValueError(f"inline Q{qn} bad start: {line[:100]}")
    stem = m.group(2).strip()
    tail = line[m.end() :].strip()
    opts: list[dict] = []
    markers = list(re.finditer(r"[A-D][\.\．]\s*", tail))
    for mi, mm in enumerate(markers):
        start = mm.end()
        end = markers[mi + 1].start() if mi + 1 < len(markers) else len(tail)
        chunk = tail[start:end].strip()
        sm = re.search(r"[（(](\d+)分[）)]\s*$", chunk)
        if not sm:
            raise ValueError(f"Q{qn} opt {mi} no score: {chunk[:100]}")
        score = int(sm.group(1))
        opts.append({"label": chunk, "score": score, "analysis": ""})
    if len(opts) != 4:
        raise ValueError(f"Q{qn} want 4 opts got {len(opts)}")
    return stem, opts


def parse_multiline_options(chunk: list[str], start: int, qn: int) -> tuple[str, list[dict], int]:
    first = chunk[start]
    m = re.match(rf"^({qn})、(.+)$", first)
    if not m:
        raise ValueError(f"multiline Q{qn} bad: {first[:80]}")
    stem = m.group(2).strip()
    i = start + 1
    # 题干后可能有补充说明行（如「如果没有课外班…」），在选项 A. 之前并入题干
    while i < len(chunk):
        peek = chunk[i]
        if re.match(r"^([A-D])[\.\．]", peek):
            break
        if re.match(r"^本题参考理论", peek) or re.match(r"^得分逻辑", peek) or re.match(r"^解析", peek):
            break
        if re.match(r"^(孩子|家长)-", peek) or re.match(r"^\d+、", peek) or re.match(r"^\d【", peek):
            break
        stem = f"{stem}\n{peek}".strip()
        i += 1
    opts: list[dict] = []
    while i < len(chunk):
        line = chunk[i]
        if re.match(r"^本题参考理论", line) or re.match(r"^得分逻辑", line) or re.match(r"^解析", line):
            break
        om = re.match(r"^([A-D])[\.\．]\s*(.+)$", line)
        if not om:
            break
        rest = om.group(2).strip()
        sm = re.search(r"[（(](\d+)分[）)]\s*$", rest)
        if not sm:
            raise ValueError(f"Q{qn} multiline opt bad: {line[:120]}")
        score = int(sm.group(1))
        opts.append({"label": rest, "score": score, "analysis": ""})
        i += 1
    if len(opts) != 4:
        raise ValueError(f"Q{qn} multiline want 4 got {len(opts)}: start={start}")
    return stem, opts, i


def parse_meta(chunk: list[str], start: int) -> tuple[dict, int]:
    theory: list[str] = []
    scoring_logic = ""
    explanation = ""
    i = start
    while i < len(chunk):
        line = chunk[i]
        if (
            re.match(r"^\d+、", line)
            or re.match(r"^\d【", line)
            or re.match(r"^(孩子|家长)-", line)
        ):
            break
        if line.startswith("本题参考理论："):
            theory = [line.replace("本题参考理论：", "").strip()]
        elif line.startswith("得分逻辑："):
            scoring_logic = line.replace("得分逻辑：", "").strip()
        elif line.startswith("解析："):
            explanation = line.replace("解析：", "").strip()
            i += 1
            while i < len(chunk):
                nxt = chunk[i]
                if (
                    re.match(r"^\d+、", nxt)
                    or re.match(r"^\d【", nxt)
                    or re.match(r"^(孩子|家长)-", nxt)
                ):
                    break
                if nxt.startswith("本题参考理论") or nxt.startswith("得分逻辑") or nxt.startswith("解析："):
                    break
                explanation = (explanation + nxt).strip()
                i += 1
            continue
        i += 1
    return {"theory": theory, "scoringLogic": scoring_logic, "explanation": explanation}, i


def parse_core_block(chunk: list[str]) -> tuple[list[dict], dict[int, dict]]:
    dim_re = re.compile(r"^(\d)【([^】]+)】")
    sub_re = re.compile(r"^(孩子|家长)-")
    questions: list[dict] = []
    details: dict[int, dict] = {}

    current_dim_num: str | None = None
    current_role: str | None = None

    i = 0
    while i < len(chunk):
        s = chunk[i]
        dm = dim_re.match(s)
        if dm:
            current_dim_num = dm.group(1)
            i += 1
            continue
        if sub_re.match(s):
            current_role = "child" if s.startswith("孩子") else "parent"
            i += 1
            continue

        qm = re.match(r"^(\d+)、", s)
        if qm:
            qn = int(qm.group(1))
            dim_name = DIM_NUM_TO_NAME.get(current_dim_num or "", "需求")
            role = current_role or "child"

            if "A." in s or "A．" in s:
                stem, opts = parse_inline_options(s, qn)
                i += 1
            else:
                stem, opts, i = parse_multiline_options(chunk, i, qn)

            meta, i = parse_meta(chunk, i)
            details[qn] = meta

            questions.append(
                {
                    "id": qn,
                    "dimension": dim_name,
                    "type": role,
                    "text": clean_question_stem(stem),
                    "options": opts,
                }
            )
            continue

        i += 1

    return questions, details


def parse_index_block(paras: list[str], start: int, kind: str) -> list[dict]:
    out: list[dict] = []
    i = start
    local_q = 0
    base_id = {"anxiety": 100, "burnout": 200, "competence": 300}[kind]
    while local_q < 3 and i < len(paras):
        line = paras[i]
        if re.match(r"^[123]、", line) and ('"' in line or "\u201c" in line):
            local_q += 1
            m = re.match(r"^[123]、(.+)$", line)
            stem = m.group(1).strip() if m else line
            opts: list[dict] = []
            i += 1
            while i < len(paras) and len(opts) < 4:
                om = re.match(r"^([A-D])[\.\．]\s*(.+)$", paras[i])
                if not om:
                    break
                rest = om.group(2).strip()
                sm = re.search(r"[（(](\d+)分[）)]", rest)
                if not sm:
                    break
                score = int(sm.group(1))
                label = rest[: sm.end()].strip()
                opts.append({"label": label, "score": score, "analysis": ""})
                i += 1
            out.append(
                {
                    "id": base_id + local_q - 1,
                    "dimension": "需求",
                    "type": kind,
                    "text": stem,
                    "options": opts,
                }
            )
            continue
        i += 1
    return out


def emit_questions_ts(
    core: list[dict],
    anxiety: list[dict],
    burnout: list[dict],
    competence: list[dict],
) -> str:
    raw = OUT_Q.read_text(encoding="utf-8")
    m = re.search(
        r"(export const dimensionDefinitions[\s\S]+?)(export const coreQuestions)",
        raw,
    )
    if not m:
        raise RuntimeError("cannot find dimensionDefinitions in existing questions.generated.ts")
    head = m.group(1).rstrip()

    lines: list[str] = [
        'import { AssessmentQuestion, DimensionDefinition, ParentTypeDefinition } from "./types";',
        head,
    ]

    def emit_q_list(name: str, arr: list[dict]):
        lines.append(f"export const {name}: AssessmentQuestion[] = ")
        lines.append(json.dumps(arr, ensure_ascii=False, indent=2))
        lines.append(";")

    emit_q_list("coreQuestions", core)
    emit_q_list("anxietyQuestions", anxiety)
    emit_q_list("burnoutQuestions", burnout)
    emit_q_list("competenceQuestions", competence)

    m2 = re.search(r"export const parentTypeDefinitions[\s\S]+\];\s*$", raw, re.MULTILINE)
    if not m2:
        raise RuntimeError("parentTypeDefinitions not found")
    lines.append(m2.group(0).rstrip())
    lines.append("")
    return "\n".join(lines)


def emit_details_ts(details: dict[int, dict], index_ids: list[int]) -> str:
    lines = [
        "export const questionDetailMap: Record<number, { theory?: string[]; scoringLogic?: string; explanation?: string }> = {",
    ]
    for qid in sorted(details.keys()):
        d = details[qid]
        lines.append(f"  {qid}: {json.dumps(d, ensure_ascii=False)},")
    for qid in index_ids:
        lines.append(f"  {qid}: {{ theory: [], scoringLogic: '', explanation: '' }},")
    lines.append("};")
    lines.append("")
    return "\n".join(lines)


def main():
    paras = read_paras()
    split_idx = next(i for i, s in enumerate(paras) if "题目结束" in s and "生成测评报告" in s)
    chunk = paras[74:split_idx]

    core, details = parse_core_block(chunk)
    if len(core) != 36:
        raise SystemExit(f"expected 36 core questions, got {len(core)}")

    tail = paras[split_idx + 1 :]
    ai = next(i for i, s in enumerate(tail) if s.startswith("家长的教育焦虑指数"))
    bi = next(i for i, s in enumerate(tail) if s.startswith("家长的养育倦怠指数"))
    ci = next(i for i, s in enumerate(tail) if s.startswith("家长的教养能力感"))

    anxiety = parse_index_block(tail, ai + 1, "anxiety")
    burnout = parse_index_block(tail, bi + 1, "burnout")
    competence = parse_index_block(tail, ci + 1, "competence")
    if len(anxiety) != 3 or len(burnout) != 3 or len(competence) != 3:
        raise SystemExit(
            f"index parse: anxiety={len(anxiety)} burnout={len(burnout)} competence={len(competence)}"
        )

    ts_q = emit_questions_ts(core, anxiety, burnout, competence)
    OUT_Q.write_text(ts_q, encoding="utf-8")

    index_ids = [100, 101, 102, 200, 201, 202, 300, 301, 302]
    ts_d = emit_details_ts(details, index_ids)
    OUT_D.write_text(ts_d, encoding="utf-8")

    print("Wrote", OUT_Q)
    print("Wrote", OUT_D)
    print("core", len(core), "details keys", len(details))


if __name__ == "__main__":
    main()
