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
export const coreQuestions: AssessmentQuestion[] = 
[
  {
    "id": 1,
    "dimension": "需求",
    "type": "child",
    "text": "去一家新餐厅，在点餐时，孩子的实际表现更接近：",
    "options": [
      {
        "label": "不看菜单，一般会说 “随便”、“听你的”。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "会和你讨论菜的口味，然后点自己喜欢的口味的菜。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "会自己看菜单，然后随便点一道菜。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "点餐时不参与，餐品上来后说“不是我想要的”。（0分）",
        "score": 0,
        "analysis": ""
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
        "label": "愤愤离开，以后不再和这2个朋友玩。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "很难过，默默地走开了。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "很难过，但还是想和他们一起玩。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "没有难过的表现，会想办法说服对方，加入进去。（3分）",
        "score": 3,
        "analysis": ""
      }
    ]
  },
  {
    "id": 3,
    "dimension": "需求",
    "type": "child",
    "text": "当孩子感到学习压力大，希望调整课外班数量时，他的实际表现更接近：\n（如果没有课外班，联想孩子其他的压力）",
    "options": [
      {
        "label": "在情绪爆发时喊出“我再也不去上XX课了！”（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "找合适时机，清晰地列出自己目前的负担，提出希望暂停的课程。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "通过持续表现消极（如拖拉磨蹭）来“暗示”你他不想上课外班了。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "跟家里其他人抱怨，表明对课外班的不喜欢。（3分）",
        "score": 3,
        "analysis": ""
      }
    ]
  },
  {
    "id": 4,
    "dimension": "需求",
    "type": "parent",
    "text": "孩子说：“我们班同学都买了这款鞋，就我没有！”，您最近一次的实际做法更接近：",
    "options": [
      {
        "label": "“我们家的消费要根据实际需要，不能盲目攀比。”（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "“听起来你真的很想拥有它，能和我说说为什么这么想要吗？”（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "“你有新鞋子呀，为啥看到别人有这款，还想要？”（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "“好了好了，我知道了，回头有空我们再去看看。”（1分）",
        "score": 1,
        "analysis": ""
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
        "label": "对孩子说“要懂礼貌”，要求他立刻打招呼。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "孩子就是胆子小，得多带他出去见见人，锻炼得大方一点。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "孩子害羞，不强迫他叫人，回头找机会带他慢慢练习。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "孩子本来就是内向的性格，没必要非得学会外向，顺其自然就好。（3分）",
        "score": 3,
        "analysis": ""
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
        "label": "“80分还不错呀，下次仔细点就能更高啦。”（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "“看你好像没什么表情，你自己对这个成绩满意吗？”（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "“班里平均分多少，你排第几名？”（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "“你自己觉得这次考得怎么样？”（3分）",
        "score": 3,
        "analysis": ""
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
        "label": "非要闹着买新的，且之后几天容易烦躁。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "非常伤心，会哭，且接下来一段时间频繁提起。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "专注于“如何找到/买新的”，不讨论情绪感受。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "会表达难过和遗憾，也会自我安慰，几天内情绪能基本平复。（5分）",
        "score": 5,
        "analysis": ""
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
        "label": "抱怨“题太偏了”或“老师没讲”，情绪激动。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "把自己关在房间，谁也不想理，但过一阵子会恢复如常。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "绝口不提这次失败，表现得像没发生过。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "又气又伤心，但情绪平复后会分析原因、总结教训。（5分）",
        "score": 5,
        "analysis": ""
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
        "label": "“好丢脸，我当时太尴尬了”，并具体向你描述那种感受和场景。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "用开玩笑自嘲的方式说“哎呀，我可真行”，来快速化解尴尬。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "之后几天，他一想起来那件事就觉得不自在，反复问你“我当时是不是很丢脸？”。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "不许再提起，要求你答应，以后别再让他参加类似的活动。（0分）",
        "score": 0,
        "analysis": ""
      }
    ]
  },
  {
    "id": 10,
    "dimension": "接纳情绪",
    "type": "parent",
    "text": "当孩子因好友转学而持续难过时，您的实际做法更接近：（参考量表1,3,7）\n（如果没有转学，联想孩子其他难过的事）",
    "options": [
      {
        "label": "这种分离的滋味确实不好受，我愿意陪你一起怀念，难过多久都没关系。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "天下没有不散的宴席，我们要多想开心的事，尽快走出来。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "我们可以多打电话、约着玩，用行动保持联系来冲淡难过。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "舍不得好朋友很正常，可以约其他好朋友一起玩。（1分）",
        "score": 1,
        "analysis": ""
      }
    ]
  },
  {
    "id": 11,
    "dimension": "接纳情绪",
    "type": "parent",
    "text": "面对孩子的愤怒大吼大叫，您最近一次的实际做法更接近：（参考量表4,6,8,9,11,12）",
    "options": [
      {
        "label": "会不知不觉就变得比他还大声，不受控制地要压住他的情绪。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "告诉他“生气解决不了问题，有话好好说，先冷静下来”。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "“是什么让你发这么大火，心里一定特别委屈吧？我在这里。”（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "“这件事能让你这么生气，说明它对你很重要，我想听听你的想法。”（3分）",
        "score": 3,
        "analysis": ""
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
        "label": "孩子开心最重要，所以我尽量满足他的合理愿望，减少他的挫折。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "我会鼓励他多尝试不同活动，开阔眼界，生活丰富多彩了心态自然而然的积极。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "与他一起对日常生活多一份觉察，教他欣赏和品味生活中的小美好。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "我认为高级的积极心态源于成就感，我会为他做好规划（如学习、特长培养）。（0分）",
        "score": 0,
        "analysis": ""
      }
    ]
  },
  {
    "id": 13,
    "dimension": "沟通",
    "type": "child",
    "text": "当你就一件事批评孩子后，他的实际做法更接近:",
    "options": [
      {
        "label": "下意识反驳，列举你的各种“罪状”，把话题扯远。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "沉默不语，无论你再问什么都说“随便”、“知道了”。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "情绪低落，但过后可能会或找机会解释他的想法。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "立即认错，态度良好，但同样的问题不久后可能再次出现。（3分）",
        "score": 3,
        "analysis": ""
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
        "label": "会主动且详细地跟你分享，包括他的看法和感受。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "会分享各种好玩的事，但不会分享自己的情绪感受（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "只有当你主动问起时，才会简单说几句。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "常常说“没什么”、“就那样”，不愿多谈。（0分）",
        "score": 0,
        "analysis": ""
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
        "label": "直接、清晰地提出请求，并说明理由说服你来买。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "直接提出想买XX，被拒绝后就算了。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "先用表现讨好你，然后在气氛好时提出。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "很少主动要这种非必需品，比较懂事，有时候会自己攒钱买。（0分）",
        "score": 0,
        "analysis": ""
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
        "label": "“你的屏幕使用时间到啦，手机该放下了。”（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "“宝贝，这个游戏是不是特别好玩？但眼睛该休息一下了。”（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "“你再不放下，这周都别想再玩手机了。”（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "“整天就知道玩手机！眼睛不要了？学习怎么办？”（0分）",
        "score": 0,
        "analysis": ""
      }
    ]
  },
  {
    "id": 17,
    "dimension": "沟通",
    "type": "parent",
    "text": "孩子抱怨“老师布置的作业太多了”，您最近一次的实际做法是：",
    "options": [
      {
        "label": "“听起来你今天被作业量压得有点烦，是觉得时间不够用是吗”（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "“是挺多的，那我们想想怎么安排能效率高一点，需要我帮忙吗？”（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "安慰他，“现在辛苦点是为了以后有更多的选择，咱们坚持一下。”（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "鼓励他，“老师布置的都是有用的，别的孩子能做完，咱们也可以。”（0分）",
        "score": 0,
        "analysis": ""
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
        "label": "“太为你高兴了！快跟我说说比赛时的情况吧？”（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "“太好了！这是你努力的结果，咱们得好好庆祝一下！”（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "“真不错！离冠军就差一步了，下次咱们瞄准第一！”（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "“真厉害！你在这方面就是有天赋！”（0分）",
        "score": 0,
        "analysis": ""
      }
    ]
  },
  {
    "id": 19,
    "dimension": "家庭系统",
    "type": "child",
    "text": "当爸爸说“不可以”，而妈妈说“没事，可以”时，孩子最常出现的行为是：",
    "options": [
      {
        "label": "感到困惑和为难，停下来不知道该听谁的。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "会问：“你们俩到底谁说了算？”或者“我该听谁的？”（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "直接听从最后说话的人，或自己更想听从的那一方。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "观察父母的情绪，如果一方特别坚持，就听从那一方。（3分）",
        "score": 3,
        "analysis": ""
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
        "label": "会尽量躲开，回自己房间或做别的事，不介入。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "会感到焦虑和害怕，试图用哭闹、搞出动静或身体不适来打断你们。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "会私下分别安慰爸爸和妈妈，试图做“和事佬”。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "会有担心，但也会明确地说这是你们俩的事情（5分）",
        "score": 5,
        "analysis": ""
      }
    ]
  },
  {
    "id": 21,
    "dimension": "家庭系统",
    "type": "child",
    "text": "关于家庭规则（如作息、电子设备使用），孩子的实际行为更符合哪种描述：",
    "options": [
      {
        "label": "很清楚规则，且知道无论向爸爸还是妈妈申请，结果都一样。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "会试探不同家长的底线，比如被一方拒绝后去问另一方。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "会直接抱怨或质疑，例如问“为什么上次可以，这次不行？”（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "在提出请求时，会先观察家长的情绪和脸色，再决定说不说或做不做。（3分）",
        "score": 3,
        "analysis": ""
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
        "label": "当着孩子的面争论，直到一方说服另一方。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "暂时搁置，事后私下沟通，尽量在孩子面前保持一致口径。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "谁主要负责这方面教育，就听谁的，互不干涉。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "让孩子自己选择听谁的，这更能培养他的主见。（1分）",
        "score": 1,
        "analysis": ""
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
        "label": "和孩子一起批评配偶的做法，说“你爸/你妈 那样确实不对”。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "倾听孩子的感受，帮他梳理需求，协助他找到有效地和配偶沟通的方法（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "答应孩子去帮他说说，并转告给配偶。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "试图缓和孩子的情绪， 向孩子解释配偶的苦衷或初衷。（3分）",
        "score": 3,
        "analysis": ""
      }
    ]
  },
  {
    "id": 24,
    "dimension": "家庭系统",
    "type": "parent",
    "text": "当您因为工作压力，对孩子讲话失去了耐心，事后您的实际做法更接近？",
    "options": [
      {
        "label": "过去就过去了，不用特意说，在我们家会自然翻篇。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "会跟孩子道歉，说“刚才我的情绪不好，不是你的错”。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "用行动弥补，比如给孩子买点好吃的、多陪他一会儿。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "告诉自己下次一定要忍住，但下次还是忍不住。（0分）",
        "score": 0,
        "analysis": ""
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
        "label": "能安静坐下，很快开始思考。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "会发会儿呆或玩会儿笔，但慢慢能进入状态。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "很容易被别的东西吸引，要提醒好几次。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "表现得烦躁或抗拒，很难开始。（0分）",
        "score": 0,
        "analysis": ""
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
        "label": "热情几天后就慢慢不提了。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "会想起来就做一下，没有固定计划。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "会大致按计划进行，但遇到难点可能需要鼓励。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "自己能安排练习或阅读进度，并且愿意为它克服困难。（5分）",
        "score": 5,
        "analysis": ""
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
        "label": "能自己控制好时间，到点就停。（5分）",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "偶尔会超时，但提醒后能接受。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "经常玩到停不下来，需要反复催促。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "会偷偷超时很久，或找借口继续玩。（0分）",
        "score": 0,
        "analysis": ""
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
        "label": "全程坐在旁边陪着，随时提醒督促，确保效率。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "会经常进去看看，有问题就及时提醒。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "和他商量好专注时间和休息规则，期间互不打扰，完成后自由安排。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "他已经养成自律习惯了，他有需要时，我再去提供帮助。（5分）",
        "score": 5,
        "analysis": ""
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
        "label": "担心他养成半途而废的毛病，鼓励他再坚持一下就能慢慢养成习惯。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "尊重他的感受，不想做就不做了。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "用奖励激励他继续，比如坚持一周就买XXX给他。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "表示理解，一起分析是目标不切实际？还是需要调整方法？（5分）",
        "score": 5,
        "analysis": ""
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
        "label": "必须严厉惩罚，才能让他记住教训、改掉坏习惯。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "取消他的一项特权（如看动画片），让他知道行为是要承担后果的。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "让他承受行为带来的自然后果，比如被他打的小朋友不愿意再和他玩了。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "等他情绪平静后，带他回顾事件、明确底线，并一起练习下次可以怎么做。（5分）",
        "score": 5,
        "analysis": ""
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
        "label": "“不行，我没做过，我不想做。”（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "“我可以试试看，但做不好别怪我。”（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "“这个我没做过，你手把手教我，我就能试试。”（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "“听起来有点意思，我想试试我能做成什么样。”（5分）",
        "score": 5,
        "analysis": ""
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
        "label": "彻底放弃，上课不听，作业不交。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "抱怨学科无聊或老师不好，但不得不硬着头皮学。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "自己也会着急，但不知道该怎么办，主动提出需要有人帮。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "会分析是不是方法不对或哪里没跟上，并自主尝试调整。（5分）",
        "score": 5,
        "analysis": ""
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
        "label": "一个人闷着，问什么都不想说。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "会发脾气、摔东西，或者对别的事特别容易烦躁。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "会直接来找你，跟你说“我好烦”、“我不想弄了”。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "自己待一会儿，等情绪平复了会主动跟你讲刚才发生了什么。（5分）",
        "score": 5,
        "analysis": ""
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
        "label": "目标设置为28天。（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "目标设置为30天。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "目标设置为32天。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "目标设置为40天。（5分）",
        "score": 5,
        "analysis": ""
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
        "label": "直接告诉他目标可能太高，并帮他设定一个更容易达成的，以免他失败后受打击。（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "大力肯定孩子的上进心，并经常用这个目标激励孩子（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "欣赏他敢想敢做的劲头，告诉他只要努力了，离目标近一点就是成功。（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "肯定他的志向，并和他讨论如何拆解成可行的步骤（5分）",
        "score": 5,
        "analysis": ""
      }
    ]
  },
  {
    "id": 36,
    "dimension": "自主",
    "type": "parent",
    "text": "当孩子抱怨“学习真没意思，不想学了”时，您最近一次的实际做法是：",
    "options": [
      {
        "label": "“现在不学，以后哪有出路？现在辛苦，以后才能不那么累”（0分）",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "“你快点专心写完，就能去玩手机/看电视了。”（1分）",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "“累了吗？那我们先休息十分钟，喝点水再继续。”（3分）",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "“怎么啦？是今天作业太难了，还是心里烦别的什么事？跟我说说。”（5分）",
        "score": 5,
        "analysis": ""
      }
    ]
  }
]
;
export const anxietyQuestions: AssessmentQuestion[] = 
[
  {
    "id": 100,
    "dimension": "需求",
    "type": "anxiety",
    "text": "“一想到孩子将来有可能上不了好学校或找不到好工作，我就感到担忧。”",
    "options": [
      {
        "label": "完全不符合 (0分)",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "偶尔如此 (1分)",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "比较符合 (3分)",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "总是如此 (5分)",
        "score": 5,
        "analysis": ""
      }
    ]
  },
  {
    "id": 101,
    "dimension": "需求",
    "type": "anxiety",
    "text": "“我会因为孩子的学习总是没有进步而烦躁。”",
    "options": [
      {
        "label": "完全不符合 (0分)",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "偶尔如此 (1分)",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "比较符合 (3分)",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "总是如此 (5分)",
        "score": 5,
        "analysis": ""
      }
    ]
  },
  {
    "id": 102,
    "dimension": "需求",
    "type": "anxiety",
    "text": "“看到教育方面的网络信息，例如升学政策解读、育儿建议，会让我感到焦虑。”",
    "options": [
      {
        "label": "完全不符合 (0分)",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "偶尔如此 (1分)",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "比较符合 (3分)",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "总是如此 (5分)",
        "score": 5,
        "analysis": ""
      }
    ]
  }
]
;
export const burnoutQuestions: AssessmentQuestion[] = 
[
  {
    "id": 200,
    "dimension": "需求",
    "type": "burnout",
    "text": "“早上醒来，一想到又要照顾孩子一整天，我就感到累极了。”",
    "options": [
      {
        "label": "完全不符合 (0分)",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "偶尔如此 (1分)",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "比较符合 (3分)",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "总是如此 (5分)",
        "score": 5,
        "analysis": ""
      }
    ]
  },
  {
    "id": 201,
    "dimension": "需求",
    "type": "burnout",
    "text": "“我觉得自己完全被家长这个角色压垮了。”",
    "options": [
      {
        "label": "完全不符合 (0分)",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "偶尔如此 (1分)",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "比较符合 (3分)",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "总是如此 (5分)",
        "score": 5,
        "analysis": ""
      }
    ]
  },
  {
    "id": 202,
    "dimension": "需求",
    "type": "burnout",
    "text": "“一想到我要为孩子做的一切，我就觉得很累。”",
    "options": [
      {
        "label": "完全不符合 (0分)",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "偶尔如此 (1分)",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "比较符合 (3分)",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "总是如此 (5分)",
        "score": 5,
        "analysis": ""
      }
    ]
  }
]
;
export const competenceQuestions: AssessmentQuestion[] = 
[
  {
    "id": 300,
    "dimension": "需求",
    "type": "competence",
    "text": "“我完全相信自己具有做一个好父亲/母亲所必备的一切技能。”",
    "options": [
      {
        "label": "非常不同意 (0分)",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "不同意 (1分)",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "同意 (3分)",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "非常同意 (5分)",
        "score": 5,
        "analysis": ""
      }
    ]
  },
  {
    "id": 301,
    "dimension": "需求",
    "type": "competence",
    "text": "“不知为什么，我有时觉得看似我在做主，实际上是在被孩子操纵着。”",
    "options": [
      {
        "label": "非常不同意 (5分)",
        "score": 5,
        "analysis": ""
      },
      {
        "label": "不同意 (3分)",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "同意 (1分)",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "非常同意 (0分)",
        "score": 0,
        "analysis": ""
      }
    ]
  },
  {
    "id": 302,
    "dimension": "需求",
    "type": "competence",
    "text": "“在悉心照料孩子方面，我达到了我个人的期望。”",
    "options": [
      {
        "label": "非常不同意 (0分)",
        "score": 0,
        "analysis": ""
      },
      {
        "label": "不同意 (1分)",
        "score": 1,
        "analysis": ""
      },
      {
        "label": "同意 (3分)",
        "score": 3,
        "analysis": ""
      },
      {
        "label": "非常同意 (5分)",
        "score": 5,
        "analysis": ""
      }
    ]
  }
]
;
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
