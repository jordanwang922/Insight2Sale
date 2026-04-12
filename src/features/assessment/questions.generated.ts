import { AssessmentQuestion, DimensionDefinition, ParentTypeDefinition } from "./types";
export const dimensionDefinitions: DimensionDefinition[] = [
  {
    name: "需求",
    icon: "💡",
    description: "识别和回应孩子真实需求的能力",
    childQuestions: [
      1,
      2,
      3
    ],
    parentQuestions: [
      4,
      5,
      6
    ]
  },
  {
    name: "接纳情绪",
    icon: "❤️",
    description: "接纳和引导孩子情绪的能力",
    childQuestions: [
      7,
      8,
      9
    ],
    parentQuestions: [
      10,
      11,
      12
    ]
  },
  {
    name: "沟通",
    icon: "💬",
    description: "建立有效亲子沟通的能力",
    childQuestions: [
      13,
      14,
      15
    ],
    parentQuestions: [
      16,
      17,
      18
    ]
  },
  {
    name: "家庭系统",
    icon: "🏠",
    description: "维护家庭系统稳定的能力",
    childQuestions: [
      19,
      20,
      21
    ],
    parentQuestions: [
      22,
      23,
      24
    ]
  },
  {
    name: "自律",
    icon: "🎯",
    description: "培养孩子自律自控的能力",
    childQuestions: [
      25,
      26,
      27
    ],
    parentQuestions: [
      28,
      29,
      30
    ]
  },
  {
    name: "自主",
    icon: "🚀",
    description: "激发孩子自主自驱的能力",
    childQuestions: [
      31,
      32,
      33
    ],
    parentQuestions: [
      34,
      35,
      36
    ]
  }
].map((definition) => ({
  ...definition,
  courseModule:
    definition.name === "需求"
      ? "模块一：认识孩子"
      : definition.name === "接纳情绪"
        ? "模块二：安全依恋"
        : definition.name === "沟通"
          ? "模块一：认识孩子"
          : definition.name === "家庭系统"
            ? "模块四：家庭协同"
            : definition.name === "自律"
              ? "模块五：科学激励"
              : "模块六：激发自驱",
}));

export const coreQuestions: AssessmentQuestion[] = [
  {
    "id": 1,
    "dimension": "需求",
    "type": "child",
    "text": "去一家新餐厅，在点餐时，孩子的实际表现更接近：",
    "options": [
      {
        "label": "不看菜单，一般会说\"随便\"、\"听你的\"",
        "score": 1,
        "analysis": "放弃表达自主权"
      },
      {
        "label": "会和你讨论菜的口味，然后点自己喜欢的口味的菜",
        "score": 5,
        "analysis": "自主决策前的信息整合"
      },
      {
        "label": "会自己看菜单，然后随便点一道菜",
        "score": 3,
        "analysis": "自主决策但未必满足自我需求"
      },
      {
        "label": "点餐时不参与，餐品上来后说\"不是我想要的\"",
        "score": 0,
        "analysis": "被动攻击式表达，导致冲突"
      }
    ]
  },
  {
    "id": 2,
    "dimension": "需求",
    "type": "child",
    "text": "孩子特别想加入2个朋友的游戏，但是被拒绝了，他的实际表现更接近：",
    "options": [
      {
        "label": "愤愤离开，以后不再和这2个朋友玩",
        "score": 0,
        "analysis": "报复性绝交"
      },
      {
        "label": "很难过，默默地走开了",
        "score": 1,
        "analysis": "受伤撤退"
      },
      {
        "label": "很难过，但还是想和他们一起玩",
        "score": 5,
        "analysis": "情绪难过但社交意愿未中断"
      },
      {
        "label": "没有难过的表现，会想办法说服对方，加入进去",
        "score": 3,
        "analysis": "情绪影响小，主动策略应对"
      }
    ]
  },
  {
    "id": 3,
    "dimension": "需求",
    "type": "child",
    "text": "当孩子感到学习压力大，希望调整课外班数量时，他的实际表现更接近：",
    "options": [
      {
        "label": "在情绪爆发时喊出\"我再也不去上XX课了！\"",
        "score": 0,
        "analysis": "用情绪爆炸替代沟通"
      },
      {
        "label": "找合适时机，清晰地列出自己目前的负担，提出希望暂停的课程",
        "score": 5,
        "analysis": "理性、建设性地提出个人需求"
      },
      {
        "label": "通过持续表现消极（如拖拉磨蹭）来\"暗示\"你他不想上课外班了",
        "score": 1,
        "analysis": "用问题行为间接表达"
      },
      {
        "label": "跟家里其他人抱怨，表明对课外班的不喜欢",
        "score": 3,
        "analysis": "通过第三方传递信息"
      }
    ]
  },
  {
    "id": 4,
    "dimension": "需求",
    "type": "parent",
    "text": "孩子说：\"我们班同学都买了这款鞋，就我没有！\"，您最近一次的实际做法更接近：",
    "options": [
      {
        "label": "\"我们家的消费要根据实际需要，不能盲目攀比\"",
        "score": 0,
        "analysis": "直接否定需求，关闭对话"
      },
      {
        "label": "\"听起来你真的很想拥有它，能和我说说为什么这么想要吗？\"",
        "score": 5,
        "analysis": "主动探索孩子内心的真实渴望"
      },
      {
        "label": "\"你有新鞋子呀，为啥看到别人有这款，还想要？\"",
        "score": 3,
        "analysis": "试图引导孩子自我觉察动机"
      },
      {
        "label": "\"好了好了，我知道了，回头有空我们再去看看\"",
        "score": 1,
        "analysis": "敷衍回应，回避深入沟通"
      }
    ]
  },
  {
    "id": 5,
    "dimension": "需求",
    "type": "parent",
    "text": "家里来亲戚时，您让孩子叫人，孩子却躲在身后不开口。您最近一次的实际做法更接近：",
    "options": [
      {
        "label": "对孩子说\"要懂礼貌\"，要求他立刻打招呼",
        "score": 0,
        "analysis": "当场否定，要求立刻改变"
      },
      {
        "label": "孩子就是胆子小，得多带他出去见见人，锻炼得大方一点",
        "score": 1,
        "analysis": "不接纳现状，试图将孩子拧成期待的样子"
      },
      {
        "label": "孩子害羞，不强迫他叫人，回头找机会带他慢慢练习",
        "score": 5,
        "analysis": "接纳当下+提供支持性练习"
      },
      {
        "label": "孩子本来就是内向的性格，没必要非得学会外向，顺其自然就好",
        "score": 3,
        "analysis": "接纳特质，不推动改变"
      }
    ]
  },
  {
    "id": 6,
    "dimension": "需求",
    "type": "parent",
    "text": "孩子拿着考了80分的卷子回家，脸上看不出高兴，也不像难过。您最近一次的实际做法更接近：",
    "options": [
      {
        "label": "\"80分还不错呀，下次仔细点就能更高啦\"",
        "score": 1,
        "analysis": "表面肯定，暗含更高期待"
      },
      {
        "label": "\"看你好像没什么表情，你自己对这个成绩满意吗？\"",
        "score": 5,
        "analysis": "关注孩子自我评价和内在感受"
      },
      {
        "label": "\"班里平均分多少，你排第几名？\"",
        "score": 0,
        "analysis": "外部比较，忽略孩子感受"
      },
      {
        "label": "\"你自己觉得这次考得怎么样？\"",
        "score": 3,
        "analysis": "把评价权还给孩子，但未进一步共情或探索"
      }
    ]
  },
  {
    "id": 7,
    "dimension": "接纳情绪",
    "type": "child",
    "text": "孩子非常喜爱的物品意外丢失，他的实际表现更接近：",
    "options": [
      {
        "label": "非要闹着买新的，且之后几天容易烦躁",
        "score": 1,
        "analysis": "情绪转化为行为诉求或易怒"
      },
      {
        "label": "非常伤心，会哭，且接下来一段时间频繁提起",
        "score": 3,
        "analysis": "充分体验情绪但调节较慢"
      },
      {
        "label": "专注于\"如何找到/买新的\"，不讨论情绪感受",
        "score": 0,
        "analysis": "回避情绪，用解决问题替代感受"
      },
      {
        "label": "会表达难过和遗憾，也会自我安慰，几天内情绪能基本平复",
        "score": 5,
        "analysis": "健康表达情绪+主动调节"
      }
    ]
  },
  {
    "id": 8,
    "dimension": "接纳情绪",
    "type": "child",
    "text": "孩子在一次非常重要的考试中失利，他的实际表现更接近：",
    "options": [
      {
        "label": "抱怨\"题太偏了\"或\"老师没讲\"，情绪激动",
        "score": 1,
        "analysis": "外归因以保护自尊"
      },
      {
        "label": "把自己关在房间，谁也不想理，但过一阵子会恢复如常",
        "score": 3,
        "analysis": "需要独处空间来自我消化"
      },
      {
        "label": "绝口不提这次失败，表现得像没发生过",
        "score": 0,
        "analysis": "情感隔离，完全否认失败"
      },
      {
        "label": "又气又伤心，但情绪平复后会分析原因、总结教训",
        "score": 5,
        "analysis": "接纳情绪并能将挫折转化为学习机会"
      }
    ]
  },
  {
    "id": 9,
    "dimension": "接纳情绪",
    "type": "child",
    "text": "孩子在很多人面前出了糗，感到非常尴尬，事后他的实际表现更接近：",
    "options": [
      {
        "label": "\"好丢脸，我当时太尴尬了\"，并具体向你描述那种感受和场景",
        "score": 5,
        "analysis": "能识别、命名并通过详细分享来加工情绪"
      },
      {
        "label": "用开玩笑自嘲的方式说\"哎呀，我可真行\"，来快速化解尴尬",
        "score": 1,
        "analysis": "使用幽默作为心理防御机制来掩饰和跳过真实感受"
      },
      {
        "label": "之后几天，他一想起来那件事就觉得不自在，反复问你\"我当时是不是很丢脸？\"",
        "score": 3,
        "analysis": "情绪持续困扰，通过反复寻求外部确认来试图缓解"
      },
      {
        "label": "不许再提起，要求你答应，以后别再让他参加类似的活动",
        "score": 0,
        "analysis": "采取行为回避策略，功能损害"
      }
    ]
  },
  {
    "id": 10,
    "dimension": "接纳情绪",
    "type": "parent",
    "text": "当孩子因好友转学而持续难过时，您的实际做法更接近：",
    "options": [
      {
        "label": "这种分离的滋味确实不好受，我愿意陪你一起怀念，难过多久都没关系",
        "score": 5,
        "analysis": "全然接纳情绪的持续时间与深度，不设限、不转移"
      },
      {
        "label": "天下没有不散的宴席，我们要多想开心的事，尽快走出来",
        "score": 0,
        "analysis": "否定情绪合理性，催促尽快走出"
      },
      {
        "label": "我们可以多打电话、约着玩，用行动保持联系来冲淡难过",
        "score": 3,
        "analysis": "用行动缓解情绪，保持联结但回避了\"难过\"本身"
      },
      {
        "label": "舍不得好朋友很正常，可以约其他好朋友一起玩",
        "score": 1,
        "analysis": "用替代关系冲淡失落，回避了当下的哀伤"
      }
    ]
  },
  {
    "id": 11,
    "dimension": "接纳情绪",
    "type": "parent",
    "text": "面对孩子的愤怒大吼大叫，您最近一次的实际做法更接近：",
    "options": [
      {
        "label": "会不知不觉就变得比他还大声，不受控制地要压住他的情绪",
        "score": 0,
        "analysis": "被情绪卷入，用更大声音压制"
      },
      {
        "label": "告诉他\"生气解决不了问题，有话好好说，先冷静下来\"",
        "score": 1,
        "analysis": "用道理要求冷静"
      },
      {
        "label": "\"是什么让你发这么大火，心里一定特别委屈吧？我在这里\"",
        "score": 5,
        "analysis": "共情情绪+陪伴姿态"
      },
      {
        "label": "\"这件事能让你这么生气，说明它对你很重要，我想听听你的想法\"",
        "score": 3,
        "analysis": "肯定情绪价值+邀请表达"
      }
    ]
  },
  {
    "id": 12,
    "dimension": "接纳情绪",
    "type": "parent",
    "text": "在培养孩子的积极心态方面，您的实际做法更接近：",
    "options": [
      {
        "label": "孩子开心最重要，所以我尽量满足他的合理愿望，减少他的挫折",
        "score": 1,
        "analysis": "通过减少挫折来维持快乐"
      },
      {
        "label": "我会鼓励他多尝试不同活动，开阔眼界，生活丰富多彩了心态自然而然的积极",
        "score": 3,
        "analysis": "通过丰富体验拓展积极情绪来源"
      },
      {
        "label": "与他一起对日常生活多一份觉察，教他欣赏和品味生活中的小美好",
        "score": 5,
        "analysis": "主动建构积极情绪的觉察与品味能力"
      },
      {
        "label": "我认为高级的积极心态源于成就感，我会为他做好规划（如学习、特长培养）",
        "score": 0,
        "analysis": "将积极心态条件化，与成就绑定"
      }
    ]
  },
  {
    "id": 13,
    "dimension": "沟通",
    "type": "child",
    "text": "当你就一件事批评孩子后，他的实际做法更接近：",
    "options": [
      {
        "label": "下意识反驳，列举你的各种\"罪状\"，把话题扯远",
        "score": 1,
        "analysis": "对抗性沟通"
      },
      {
        "label": "沉默不语，无论你再问什么都说\"随便\"、\"知道了\"",
        "score": 0,
        "analysis": "沟通关闭"
      },
      {
        "label": "情绪低落，但过后可能会或找机会解释他的想法",
        "score": 5,
        "analysis": "能在情绪平复后发起建设性回馈"
      },
      {
        "label": "立即认错，态度良好，但同样的问题不久后可能再次出现",
        "score": 3,
        "analysis": "表面顺从但未真正解决问题"
      }
    ]
  },
  {
    "id": 14,
    "dimension": "沟通",
    "type": "child",
    "text": "孩子在学校遇到的事，他频率最高的实际表现是：",
    "options": [
      {
        "label": "会主动且详细地跟你分享，包括他的看法和感受",
        "score": 5,
        "analysis": "主动开放，愿意分享事实+情绪+观点"
      },
      {
        "label": "会分享各种好玩的事，但不会分享自己的情绪感受",
        "score": 3,
        "analysis": "分享事实，但情绪部分保留"
      },
      {
        "label": "只有当你主动问起时，才会简单说几句",
        "score": 1,
        "analysis": "被动回应，需要外部启动"
      },
      {
        "label": "常常说\"没什么\"、\"就那样\"，不愿多谈",
        "score": 0,
        "analysis": "沟通关闭，用敷衍回避深入交流"
      }
    ]
  },
  {
    "id": 15,
    "dimension": "沟通",
    "type": "child",
    "text": "当孩子想买非必需品（如买流行的玩具）时，他频率最高的实际表现是：",
    "options": [
      {
        "label": "直接、清晰地提出请求，并说明理由说服你来买",
        "score": 5,
        "analysis": "清晰表达需求+主动沟通协商"
      },
      {
        "label": "直接提出想买XX，被拒绝后就算了",
        "score": 1,
        "analysis": "能开口但一击即退"
      },
      {
        "label": "先用表现讨好你，然后在气氛好时提出",
        "score": 3,
        "analysis": "策略性表达，绕开直接冲突"
      },
      {
        "label": "很少主动要这种非必需品，比较懂事，有时候会自己攒钱买",
        "score": 0,
        "analysis": "压抑需求，用\"懂事\"掩盖真实想法"
      }
    ]
  },
  {
    "id": 16,
    "dimension": "沟通",
    "type": "parent",
    "text": "看到孩子长时间玩手机，你希望他停下，您最近一次的实际做法是：",
    "options": [
      {
        "label": "\"你的屏幕使用时间到啦，手机该放下了\"",
        "score": 5,
        "analysis": "客观陈述事实+信任孩子能执行"
      },
      {
        "label": "\"宝贝，这个游戏是不是特别好玩？但眼睛该休息一下了\"",
        "score": 3,
        "analysis": "共情兴趣+温和提醒"
      },
      {
        "label": "\"你再不放下，这周都别想再玩手机了\"",
        "score": 1,
        "analysis": "用外部惩罚威胁"
      },
      {
        "label": "\"整天就知道玩手机！眼睛不要了？学习怎么办？\"",
        "score": 0,
        "analysis": "指责人格+夸大后果"
      }
    ]
  },
  {
    "id": 17,
    "dimension": "沟通",
    "type": "parent",
    "text": "孩子抱怨\"老师布置的作业太多了\"，您最近一次的实际做法是：",
    "options": [
      {
        "label": "\"听起来你今天被作业量压得有点烦，是觉得时间不够用是吗\"",
        "score": 5,
        "analysis": "准确反映情绪并探索具体需求，实现深度倾听"
      },
      {
        "label": "\"是挺多的，那我们想想怎么安排能效率高一点，需要我帮忙吗？\"",
        "score": 3,
        "analysis": "共情后转向协作解决问题"
      },
      {
        "label": "安慰他，\"现在辛苦点是为了以后有更多的选择，咱们坚持一下\"",
        "score": 1,
        "analysis": "看似鼓励的未来导向说教，但忽略了当下的情绪认可"
      },
      {
        "label": "鼓励他，\"老师布置的都是有用的，别的孩子能做完，咱们也可以\"",
        "score": 0,
        "analysis": "否定感受并进行\"隐性比较\"，强调服从与从众"
      }
    ]
  },
  {
    "id": 18,
    "dimension": "沟通",
    "type": "parent",
    "text": "孩子兴冲冲地告诉你他/她在某次比赛中拿了第二名，您的实际做法更接近：",
    "options": [
      {
        "label": "\"太为你高兴了！快跟我说说比赛时的情况吧？\"",
        "score": 5,
        "analysis": "分享喜悦并自然引导孩子回顾和讲述过程"
      },
      {
        "label": "\"太好了！这是你努力的结果，咱们得好好庆祝一下！\"",
        "score": 3,
        "analysis": "将成功与努力关联并共同庆祝"
      },
      {
        "label": "\"真不错！离冠军就差一步了，下次咱们瞄准第一！\"",
        "score": 1,
        "analysis": "在肯定后立即转移目标到\"未得的榜首\""
      },
      {
        "label": "\"真厉害！你在这方面就是有天赋！\"",
        "score": 0,
        "analysis": "将成功归因于不可控的\"天赋\"，固定型思维表扬"
      }
    ]
  },
  {
    "id": 19,
    "dimension": "家庭系统",
    "type": "child",
    "text": "当爸爸说\"不可以\"，而妈妈说\"没事，可以\"时，孩子最常出现的行为是：",
    "options": [
      {
        "label": "感到困惑和为难，停下来不知道该听谁的",
        "score": 1,
        "analysis": "因不一致而功能受阻（困惑）"
      },
      {
        "label": "会问\"你们俩到底谁说了算？\"或者\"我该听谁的？\"",
        "score": 5,
        "analysis": "能识别不一致并试图澄清，促进系统透明化"
      }
    ]
  },
  {
    "id": 20,
    "dimension": "家庭系统",
    "type": "child",
    "text": "当父母发生争执时，孩子最常出现的行为是：",
    "options": [
      {
        "label": "会尽量躲开，回自己房间或做别的事，不介入",
        "score": 3,
        "analysis": "采取自我保护策略，但不卷入"
      },
      {
        "label": "会感到焦虑和害怕，试图用哭闹、搞出动静或身体不适来打断你们",
        "score": 0,
        "analysis": "被情绪深度卷入，用问题行为来应对父母的冲突"
      },
      {
        "label": "会私下分别安慰爸爸妈妈，试图做\"和事佬\"",
        "score": 1,
        "analysis": "主动卷入，承担调解者角色（三角化）"
      },
      {
        "label": "会有担心，但也会明确地说这是你们俩的事情",
        "score": 5,
        "analysis": "有清晰的边界感，能区分父母议题与自我议题"
      }
    ]
  },
  {
    "id": 21,
    "dimension": "家庭系统",
    "type": "child",
    "text": "关于家庭规则（如作息、电子设备使用）孩子的实际行为更符合哪种描述：",
    "options": [
      {
        "label": "很清楚规则，且知道无论向爸爸还是妈妈申请，结果都一样",
        "score": 5,
        "analysis": "规则清晰一致，孩子内化良好"
      },
      {
        "label": "会试探不同家长的底线，比如被一方拒绝后去问另一方",
        "score": 0,
        "analysis": "利用系统不一致，主动操纵规则"
      },
      {
        "label": "会直接抱怨或质疑，例如问\"为什么上次可以，这次不行？\"",
        "score": 1,
        "analysis": "因不一致而感到困惑并用言语表达不满，规则感被破坏"
      },
      {
        "label": "在提出请求时，会先观察家长的情绪和脸色，再决定说不说或做不做",
        "score": 3,
        "analysis": "规则模糊，孩子习得通过\"情境评估\"来导航系统"
      }
    ]
  },
  {
    "id": 22,
    "dimension": "家庭系统",
    "type": "parent",
    "text": "当您与配偶在教育孩子的问题上意见严重不一时，您最近一次的实际做法是：",
    "options": [
      {
        "label": "当着孩子的面争论，直到一方说服另一方",
        "score": 0,
        "analysis": "公开冲突，让孩子直接暴露在分裂中"
      },
      {
        "label": "暂时搁置，事后私下沟通，尽量在孩子面前保持一致口径",
        "score": 5,
        "analysis": "维护系统一致性与孩子安全感，优先夫妻私下协商"
      },
      {
        "label": "谁主要负责这方面教育，就听谁的，互不干涉",
        "score": 3,
        "analysis": "建立分工边界，但可能造成规则割裂"
      },
      {
        "label": "让孩子自己选择听谁的，这更能培养他的主见",
        "score": 1,
        "analysis": "将矛盾和责任转移给孩子，造成其忠诚度冲突和压力"
      }
    ]
  },
  {
    "id": 23,
    "dimension": "家庭系统",
    "type": "parent",
    "text": "当孩子向您抱怨您的配偶时，您最近一次的实际做法是：",
    "options": [
      {
        "label": "和孩子一起批评配偶的做法，说\"你爸/你妈那样确实不对\"",
        "score": 0,
        "analysis": "与孩子结盟对抗配偶"
      },
      {
        "label": "倾听孩子的感受，帮他梳理需求，协助他找到有效地和配偶沟通的方法",
        "score": 5,
        "analysis": "守住边界+赋能孩子直接沟通"
      },
      {
        "label": "答应孩子去帮他说说，并转告给配偶",
        "score": 1,
        "analysis": "卷入三角化，成为传话筒"
      },
      {
        "label": "试图缓和孩子的情绪，向孩子解释配偶的苦衷或初衷",
        "score": 3,
        "analysis": "试图调解但仍在传递信息"
      }
    ]
  },
  {
    "id": 24,
    "dimension": "家庭系统",
    "type": "parent",
    "text": "当您因为工作压力，对孩子讲话失去了耐心，事后您的实际做法更接近：",
    "options": [
      {
        "label": "过去就过去了，不用特意说，在我们家会自然翻篇",
        "score": 1,
        "analysis": "忽视修复机会，靠\"以后注意\"自我说服"
      },
      {
        "label": "会跟孩子道歉，说\"刚才我的情绪不好，不是你的错\"",
        "score": 5,
        "analysis": "主动道歉+划清责任边界"
      },
      {
        "label": "用行动弥补，比如给孩子买点好吃的、多陪他一会儿",
        "score": 3,
        "analysis": "用行动补偿但未语言化"
      },
      {
        "label": "告诉自己下次一定要忍住，但下次还是忍不住",
        "score": 0,
        "analysis": "陷入自责但无行动"
      }
    ]
  },
  {
    "id": 25,
    "dimension": "自律",
    "type": "child",
    "text": "孩子写作业时，最初几分钟的表现通常是？",
    "options": [
      {
        "label": "能安静坐下，很快开始思考",
        "score": 5,
        "analysis": "具备优秀的专注启动能力"
      },
      {
        "label": "会发会儿呆或玩会儿笔，但慢慢能进入状态",
        "score": 3,
        "analysis": "有正常的启动过程"
      },
      {
        "label": "很容易被别的东西吸引，要提醒好几次",
        "score": 1,
        "analysis": "专注力易分散，启动困难"
      },
      {
        "label": "表现得烦躁或抗拒，很难开始",
        "score": 0,
        "analysis": "存在情绪和行为障碍"
      }
    ]
  },
  {
    "id": 26,
    "dimension": "自律",
    "type": "child",
    "text": "对于需要长期坚持才能见效的事（比如学会一项运动、读完一套书），孩子通常的实际做法是？",
    "options": [
      {
        "label": "热情几天后就慢慢不提了",
        "score": 0,
        "analysis": "缺乏持续性和耐心"
      },
      {
        "label": "会想起来就做一下，没有固定计划",
        "score": 1,
        "analysis": "兴趣驱动，随意性强"
      },
      {
        "label": "会大致按计划进行，但遇到难点可能需要鼓励",
        "score": 3,
        "analysis": "有基本的坚持和计划性"
      },
      {
        "label": "自己能安排练习或阅读进度，并且愿意为它克服困难",
        "score": 5,
        "analysis": "具备自我驱动和坚持的能力"
      }
    ]
  },
  {
    "id": 27,
    "dimension": "自律",
    "type": "child",
    "text": "对于玩手机或看电视的时间，在没有大人盯着的时候，孩子通常的实际做法是：",
    "options": [
      {
        "label": "能自己控制好时间，到点就停",
        "score": 5,
        "analysis": "内化了规则，自我管理能力强"
      },
      {
        "label": "偶尔会超时，但提醒后能接受",
        "score": 3,
        "analysis": "需要外部监督作为辅助"
      },
      {
        "label": "经常玩到停不下来，需要反复催促",
        "score": 1,
        "analysis": "自控力弱，依赖外部控制"
      },
      {
        "label": "会偷偷超时很久，或找借口继续玩",
        "score": 0,
        "analysis": "自控失效，并可能伴有欺骗行为"
      }
    ]
  },
  {
    "id": 28,
    "dimension": "自律",
    "type": "parent",
    "text": "为了帮助孩子完成作业，您实际在做的是？",
    "options": [
      {
        "label": "全程坐在旁边陪着，随时提醒督促，确保效率",
        "score": 0,
        "analysis": "全程管控，替代孩子行使自我管理功能"
      },
      {
        "label": "会经常进去看看，有问题就及时提醒",
        "score": 1,
        "analysis": "外部监督为主，孩子依赖提醒"
      },
      {
        "label": "和他商量好专注时间和休息规则，期间互不打扰，完成后自由安排",
        "score": 3,
        "analysis": "通过共同协商建立规则，培养孩子的时间管理意识"
      },
      {
        "label": "他已经养成自律习惯了，他有需要时，我再去提供帮助",
        "score": 5,
        "analysis": "孩子已形成稳定的自我管理能力，家长退居支持者角色"
      }
    ]
  },
  {
    "id": 29,
    "dimension": "自律",
    "type": "parent",
    "text": "孩子为自己设定了一个目标（如坚持晨读英语），但几天后觉得太累想放弃，您实际在做的是？",
    "options": [
      {
        "label": "担心他养成半途而废的毛病，鼓励他再坚持一下就能慢慢养成习惯",
        "score": 0,
        "analysis": "用\"坚持\"施压，忽视孩子真实的疲惫信号"
      },
      {
        "label": "尊重他的感受，不想做就不做了",
        "score": 1,
        "analysis": "彻底放弃，错失培养坚持的机会"
      },
      {
        "label": "用奖励激励他继续，比如坚持一周就买XXX给他",
        "score": 3,
        "analysis": "用外部奖励维持动机，但可能削弱内在动力"
      },
      {
        "label": "表示理解，一起分析是目标不切实际？还是需要调整方法？",
        "score": 5,
        "analysis": "接纳情绪+共同复盘，将困难转化为调整策略的契机"
      }
    ]
  },
  {
    "id": 30,
    "dimension": "自律",
    "type": "parent",
    "text": "当孩子反复出现同一种不当行为（如发脾气、打人）时，您实际在做的是？",
    "options": [
      {
        "label": "必须严厉惩罚，才能让他记住教训、改掉坏习惯",
        "score": 0,
        "analysis": "严厉惩罚，用恐惧压制行为"
      },
      {
        "label": "取消他的一项特权（如看动画片），让他知道行为是要承担后果的",
        "score": 1,
        "analysis": "逻辑后果，人为施加与行为相关的代价"
      },
      {
        "label": "让他承受行为带来的自然后果，比如被他打的小朋友不愿意再和他玩了",
        "score": 3,
        "analysis": "自然后果，让现实教会孩子"
      },
      {
        "label": "等他情绪平静后，带他回顾事件、明确底线，并一起练习下次可以怎么做",
        "score": 5,
        "analysis": "情绪接纳+底线清晰+技能训练"
      }
    ]
  },
  {
    "id": 31,
    "dimension": "自主",
    "type": "child",
    "text": "当您给孩子一件有挑战的新任务时，孩子的第一反应通常是：",
    "options": [
      {
        "label": "\"不行，我没做过，我不想做\"",
        "score": 0,
        "analysis": "直接拒绝，回避陌生任务"
      },
      {
        "label": "\"我可以试试看，但做不好别怪我\"",
        "score": 3,
        "analysis": "愿意独立尝试但害怕被评判"
      },
      {
        "label": "\"这个我没做过，你手把手教我，我就能试试\"",
        "score": 1,
        "analysis": "愿意尝试但需要成人全程陪同，依赖外部支持"
      },
      {
        "label": "\"听起来有点意思，我想试试我能做成什么样\"",
        "score": 5,
        "analysis": "对挑战本身好奇，内在驱动"
      }
    ]
  },
  {
    "id": 32,
    "dimension": "自主",
    "type": "child",
    "text": "当孩子对某个学科感到厌倦，成绩下滑时，他实际通常会：",
    "options": [
      {
        "label": "彻底放弃，上课不听，作业不交",
        "score": 0,
        "analysis": "行为上彻底放弃"
      },
      {
        "label": "抱怨学科无聊或老师不好，但不得不硬着头皮学",
        "score": 1,
        "analysis": "外部归因，被动忍受"
      },
      {
        "label": "自己也会着急，但不知道该怎么办，主动提出需要有人帮",
        "score": 3,
        "analysis": "有焦虑感和求助意愿，但缺乏方法"
      },
      {
        "label": "会分析是不是方法不对或哪里没跟上，并自主尝试调整",
        "score": 5,
        "analysis": "具备自我调节和问题解决的主动性"
      }
    ]
  },
  {
    "id": 33,
    "dimension": "自主",
    "type": "child",
    "text": "当孩子在某件事上感到挫败、情绪低落时，他更常见的做法是：",
    "options": [
      {
        "label": "一个人闷着，问什么都不想说",
        "score": 1,
        "analysis": "情绪闭锁，独自消化但消化不了"
      },
      {
        "label": "会发脾气、摔东西，或者对别的事特别容易烦躁",
        "score": 0,
        "analysis": "情绪外溢，用破坏性行为表达"
      },
      {
        "label": "会直接来找你，跟你说\"我好烦\"、\"我不想弄了\"",
        "score": 3,
        "analysis": "能识别情绪并主动求助"
      },
      {
        "label": "自己待一会儿，等情绪平复了会主动跟你讲刚才发生了什么",
        "score": 5,
        "analysis": "具备自我安抚能力+愿意事后开放沟通"
      }
    ]
  },
  {
    "id": 34,
    "dimension": "自主",
    "type": "parent",
    "text": "如果孩子有一项任务，尽力完成需要30天。您会倾向于怎样要求孩子？",
    "options": [
      {
        "label": "目标设置为28天",
        "score": 0,
        "analysis": "用加速目标施压，外部控制导向"
      },
      {
        "label": "目标设置为30天",
        "score": 1,
        "analysis": "按客观标准设定，未激活内在承诺"
      },
      {
        "label": "目标设置为32天",
        "score": 3,
        "analysis": "提供适度缓冲，允许从容完成"
      },
      {
        "label": "目标设置为40天",
        "score": 5,
        "analysis": "给予孩子弹性空间，支持自主规划"
      }
    ]
  },
  {
    "id": 35,
    "dimension": "自主",
    "type": "parent",
    "text": "当孩子设定了一个看起来很难实现的目标时，您的实际做法是：",
    "options": [
      {
        "label": "直接告诉他目标可能太高，并帮他设定一个更容易达成的，以免他失败后受打击",
        "score": 1,
        "analysis": "善意但替孩子降低挑战"
      },
      {
        "label": "大力肯定孩子的上进心，并经常用这个目标激励孩子",
        "score": 0,
        "analysis": "将目标工具化，变成外部激励的筹码"
      },
      {
        "label": "欣赏他敢想敢做的劲头，告诉他只要努力了，离目标近一点就是成功",
        "score": 3,
        "analysis": "接纳梦想+过程导向的鼓励"
      },
      {
        "label": "肯定他的志向，并和他讨论如何拆解成可行的步骤",
        "score": 5,
        "analysis": "接纳梦想+提供策略支架"
      }
    ]
  },
  {
    "id": 36,
    "dimension": "自主",
    "type": "parent",
    "text": "当孩子抱怨\"学习真没意思，不想学了\"时，您最近一次的实际做法是：",
    "options": [
      {
        "label": "\"现在不学，以后哪有出路？现在辛苦，以后才能不那么累\"",
        "score": 0,
        "analysis": "用未来恐惧施压，强化学习的外部强迫感"
      },
      {
        "label": "\"你快点专心写完，就能去玩手机/看电视了\"",
        "score": 1,
        "analysis": "用外部奖励置换内在动机"
      },
      {
        "label": "\"累了吗？那我们先休息十分钟，喝点水再继续\"",
        "score": 3,
        "analysis": "接纳情绪并提供支持性调节策略"
      },
      {
        "label": "\"怎么啦？是今天作业太难了，还是心里烦别的什么事？跟我说说\"",
        "score": 5,
        "analysis": "探索行为背后的深层原因，将厌学视为需要被理解的信号"
      }
    ]
  }
];

export const anxietyQuestions: AssessmentQuestion[] = [
  {
    "id": 100,
    "dimension": "需求",
    "type": "anxiety",
    "text": "\"一想到孩子将来有可能上不了好学校或找不到好工作，我就感到担忧。\"",
    "options": [
      {
        "label": "完全不符合",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "偶尔如此",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "比较符合",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "总是如此",
        "score": 5,
        "analysis": ""
      }
    ]
  },
  {
    "id": 101,
    "dimension": "需求",
    "type": "anxiety",
    "text": "\"我会因为孩子的学习总是没有进步而烦躁。\"",
    "options": [
      {
        "label": "完全不符合",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "偶尔如此",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "比较符合",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "总是如此",
        "score": 5,
        "analysis": ""
      }
    ]
  },
  {
    "id": 102,
    "dimension": "需求",
    "type": "anxiety",
    "text": "\"看到教育方面的网络信息，例如升学政策解读、育儿建议，会让我感到焦虑。\"",
    "options": [
      {
        "label": "完全不符合",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "偶尔如此",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "比较符合",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "总是如此",
        "score": 5,
        "analysis": ""
      }
    ]
  }
];

export const burnoutQuestions: AssessmentQuestion[] = [
  {
    "id": 200,
    "dimension": "需求",
    "type": "burnout",
    "text": "\"早上醒来，一想到又要照顾孩子一整天，我就感到累极了。\"",
    "options": [
      {
        "label": "完全不符合",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "偶尔如此",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "比较符合",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "总是如此",
        "score": 5,
        "analysis": ""
      }
    ]
  },
  {
    "id": 201,
    "dimension": "需求",
    "type": "burnout",
    "text": "\"我觉得自己完全被家长这个角色压垮了。\"",
    "options": [
      {
        "label": "完全不符合",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "偶尔如此",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "比较符合",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "总是如此",
        "score": 5,
        "analysis": ""
      }
    ]
  },
  {
    "id": 202,
    "dimension": "需求",
    "type": "burnout",
    "text": "\"一想到我要为孩子做的一切，我就觉得很累。\"",
    "options": [
      {
        "label": "完全不符合",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "偶尔如此",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "比较符合",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "总是如此",
        "score": 5,
        "analysis": ""
      }
    ]
  }
];

export const competenceQuestions: AssessmentQuestion[] = [
  {
    "id": 300,
    "dimension": "需求",
    "type": "competence",
    "text": "\"我完全相信自己具有做一个好父亲/母亲所必备的一切技能。\"",
    "options": [
      {
        "label": "非常不同意",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "不同意",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "同意",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "非常同意",
        "score": 5,
        "analysis": ""
      }
    ]
  },
  {
    "id": 301,
    "dimension": "需求",
    "type": "competence",
    "text": "\"不知为什么，我有时觉得看似我在做主，实际上是在被孩子操纵着。\"",
    "options": [
      {
        "label": "非常不同意",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "不同意",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "同意",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "非常同意",
        "score": 0,
        "analysis": ""
      }
    ]
  },
  {
    "id": 302,
    "dimension": "需求",
    "type": "competence",
    "text": "\"在悉心照料孩子方面，我达到了我个人的期望。\"",
    "options": [
      {
        "label": "非常不同意",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "不同意",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "同意",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "非常同意",
        "score": 5,
        "analysis": ""
      }
    ]
  }
];

export const parentTypeDefinitions: ParentTypeDefinition[] = [
  {
    "id": 1,
    name: "权威型",
    description: "满分家长，有过度养育风险",
    "characteristics": [
      "高接纳+高要求",
      "规则清晰且温和",
      "关注孩子感受也关注成长"
    ],
    "suggestions": [
      "适当放手，给孩子更多自主空间",
      "警惕过度介入，给孩子试错机会"
    ]
  },
  {
    "id": 2,
    name: "温和管控型",
    description: "暖心可靠，管控略显紧绷",
    "characteristics": [
      "高接纳+中要求",
      "温暖但有时过于控制",
      "需要学会适度放手"
    ],
    "suggestions": [
      "增加对孩子自主性的支持",
      "尝试用启发式提问代替直接指令"
    ]
  },
  {
    "id": 3,
    name: "独裁型",
    description: "责任感很强，控制感也很强",
    "characteristics": [
      "低接纳+高要求",
      "规则严格但缺乏温暖",
      "孩子可能表面顺从"
    ],
    "suggestions": [
      "练习先处理情绪再处理问题",
      "每天找机会表达对孩子感受的理解"
    ]
  },
  {
    "id": 4,
    name: "爱心管家型",
    description: "用心陪伴，也替他承担",
    "characteristics": [
      "高接纳+过度帮助",
      "爱意满满但可能过度保护",
      "容易替孩子做决定"
    ],
    "suggestions": [
      "区分\"帮助\"和\"替代\"",
      "当孩子想放弃时，先接住情绪再讨论方法"
    ]
  },
  {
    "id": 5,
    name: "温柔引导型",
    description: "方向正确，结构不稳",
    "characteristics": [
      "高接纳+低要求",
      "温柔有爱但规则较弱",
      "孩子可能缺乏边界感"
    ],
    "suggestions": [
      "建立清晰一致的家庭规则",
      "学会温和而坚定地设定底线"
    ]
  },
  {
    "id": 6,
    name: "冷静管理型",
    description: "负责，但不够温柔",
    "characteristics": [
      "中接纳+高要求",
      "规则清晰但情感连接不足",
      "孩子可能报喜不报忧"
    ],
    "suggestions": [
      "增加情感对话的比例",
      "练习在规则执行前先共情孩子的感受"
    ]
  },
  {
    "id": 7,
    name: "放任型",
    description: "有温情，无规则底线",
    "characteristics": [
      "高接纳+无要求",
      "关系亲密但规则缺失",
      "孩子可能缺乏自律"
    ],
    "suggestions": [
      "建立必要的家庭规则和界限",
      "规则制定时邀请孩子参与，增加承诺感"
    ]
  },
  {
    "id": 8,
    name: "温情弹性型",
    description: "缺少引导的爱",
    "characteristics": [
      "低接纳+低要求",
      "关注较少但不过度控制",
      "孩子可能缺乏方向感"
    ],
    "suggestions": [
      "增加对孩子日常的关注和对话",
      "在孩子需要时提供适度的方向指引"
    ]
  },
  {
    "id": 9,
    name: "忽视型",
    description: "不是不爱，而是没有能量",
    "characteristics": [
      "低接纳+低要求",
      "可能正经历养育倦怠",
      "难以给予孩子足够支持"
    ],
    "suggestions": [
      "先照顾好自己，才能更好照顾孩子",
      "寻求家人或专业人士的支持"
    ]
  }
];
