# LOLOBCrawler

抓取TGP上的LOL OB文件，并且提供OB服务器功能

文件列表：

launch.js—————————用于启动LOL进程

lol_ob.ico————————作为网站的favicon.ico

ob_crawler.js—————爬取TGP上的OB文件，并把OB文件信息保存到数据库

ob_http.js————————提供收集到的OB文件信息，以及提供OB服务器功能

ob_main.js————————主逻辑

ob_resolver.js————OB文件解析器



mysql数据表：

CREATE TABLE `ob_info` (
  `log_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'OB 收录日期',
  
  `game_id` int(11) unsigned NOT NULL COMMENT '游戏 ID',
  
  `ob_file_status` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT 'OB 文件状态：0 - 待下载，1 - 已下载，2 - 已删除',
  
  `ob_file_url` varchar(512) NOT NULL COMMENT 'OB 文件下载路径',
  
  `encryption_key` varchar(255) NOT NULL COMMENT '通讯密钥',
  
  `platform_id` varchar(16) NOT NULL COMMENT '对战平台服务器名称',
  
  `area_id` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '游戏服务器分区 ID',
  
  `game_start_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '游戏开始时间日期',
  
  `game_length` mediumint(8) unsigned NOT NULL DEFAULT '0' COMMENT '游戏时长',
  
  `participants` varchar(2048) NOT NULL COMMENT '召唤师列表',
  
  `banned` varchar(1024) NOT NULL COMMENT '禁用的英雄列表',
  
  PRIMARY KEY (`game_id`,`platform_id`),
  
  KEY `k` (`game_id`,`platform_id`)
  
) ENGINE=MyISAM DEFAULT CHARSET=utf8

依赖库：

npm install --save -g colors

npm install --save -g mysql

使用方法：


服务器：

将lol_ob.ico ob_crawler.js ob_http.js ob_main.js ob_resolver.js放置于服务器，配置ob_main.js：

CRAWL_INTERVAL————————查询TGP上OB列表的间隔毫秒数

HTTP_PORT—————————————HTTP服务器的端口

CACHED_OB_DAYS————————OB文件将缓存在服务器上的天数


启动服务器：

node ob_main.js


打开浏览器输入以下地址可以测试服务器是否启动成功：

http://server_ip:10108/search?hero=20

（此URL可以搜索出所有有使用“努努”的OB比赛信息）


所有英雄ID对应列表：

1 - 黑暗之女 - 安妮，2 - 狂战士 - 奥拉夫，3 - 哨兵之殇 - 加里奥，4 - 卡牌大师 - 崔斯特，5 - 德邦总管 - 赵信，

6 - 首领之傲 - 厄加特，7 - 诡术妖姬 - 乐芙兰，8 - 猩红收割者 - 弗拉基米尔，9 - 末日使者 - 费德提克，10 - 审判天使 - 凯尔，

11 - 无极剑圣 - 易，12 - 牛头酋长 - 阿利斯塔，13 - 流浪法师 - 瑞兹，14 - 亡灵战神 - 赛恩，15 - 战争女神 - 希维尔，

16 - 众星之子 - 索拉卡，17 - 迅捷斥候 - 提莫，18 - 麦林炮手 - 崔丝塔娜，19 - 嗜血猎手 - 沃里克，20 - 雪人骑士 - 努努，

21 - 赏金猎人 - 厄运小姐，22 - 寒冰射手 - 艾希，23 - 蛮族之王 - 泰达米尔，24 - 武器大师 - 贾克斯，25 - 堕落天使 - 莫甘娜，

26 - 时光守护者 - 基兰，27 - 炼金术士 - 辛吉德，28 - 寡妇制造者 - 伊芙琳，29 - 瘟疫之源 - 图奇，30 - 死亡颂唱者 - 卡尔萨斯，

31 - 虚空恐惧 - 科加斯，32 - 殇之木乃伊 - 阿木木，33 - 披甲龙龟 - 拉莫斯，34 - 冰晶凤凰 - 艾尼维亚，35 - 恶魔小丑 - 萨科，

36 - 祖安狂人 - 蒙多医生，37 - 琴瑟仙女 - 娑娜，38 - 虚空行者 - 卡萨丁，39 - 刀锋意志 - 艾瑞莉娅，40 - 风暴之怒 - 迦娜，

41 - 海洋之灾 - 普朗克，42 - 英勇投弹手 - 库奇，43 - 天启者 - 卡尔玛，44 - 瓦洛兰之盾 - 塔里克，45 - 邪恶小法师 - 维迦，

48 - 巨魔之王 - 特朗德尔，50 - 策士统领 - 斯维因，51 - 皮城女警 - 凯特琳，53 - 蒸汽机器人 - 布里茨，54 - 熔岩巨兽 - 墨菲特，

55 - 不祥之刃 - 卡特琳娜，56 - 永恒梦魇 - 魔腾，57 - 扭曲树精 - 茂凯，58 - 荒漠屠夫 - 雷克顿，59 - 德玛西亚皇子 - 嘉文四世，

60 - 蜘蛛女皇 - 伊莉丝，61 - 发条魔灵 - 奥莉安娜，62 - 齐天大圣 - 孙悟空，63 - 复仇焰魂 - 布兰德，64 - 盲僧 - 李青，

67 - 暗夜猎手 - 薇恩，68 - 机械公敌 - 兰博，69 - 魔蛇之拥 - 卡西奥佩娅，72 - 水晶先锋 - 斯卡纳，74 - 大发明家 - 黑默丁格，

75 - 沙漠死神 - 内瑟斯，76 - 狂野女猎手 - 奈德丽，77 - 兽灵行者 - 乌迪尔，78 - 圣锤之毅 - 波比，79 - 酒桶 - 古拉加斯，

80 - 战争之王 - 潘森，81 - 探险家 - 伊泽瑞尔，82 - 铁铠冥魂 - 莫德凯撒，83 - 掘墓者 - 约里克，84 - 暗影之拳 - 阿卡丽，

85 - 狂暴之心 - 凯南，86 - 德玛西亚之力 - 盖伦，89 - 曙光女神 - 蕾欧娜，90 - 虚空先知 - 玛尔扎哈，91 - 刀锋之影 - 泰隆，

92 - 放逐之刃 - 锐雯，96 - 深渊巨口 - 克格莫，98 - 暮光之眼 - 慎，99 - 光辉女郎 - 拉克丝，101 - 远古巫灵 - 泽拉斯，

102 - 龙血武姬 - 希瓦娜，103 - 九尾妖狐 - 阿狸，104 - 法外狂徒 - 格雷福斯，105 - 潮汐海灵 - 菲兹，106 - 雷霆咆哮 - 沃利贝尔，

107 - 傲之追猎者 - 雷恩加尔，110 - 惩戒之箭 - 韦鲁斯，111 - 深海泰坦 - 诺提勒斯，112 - 机械先驱 - 维克托，

113 - 凛冬之怒 - 瑟庄妮，114 - 无双剑姬 - 菲奥娜，115 - 爆破鬼才 - 吉格斯，117 - 仙灵女巫 - 璐璐，119 - 荣耀行刑官 - 德莱文，

120 - 战争之影 - 赫卡里姆，121 - 虚空掠夺者 - 卡兹克，122 - 诺克萨斯之手 - 德莱厄斯，126 - 未来守护者 - 杰斯，

127 - 冰霜女巫 - 丽桑卓，131 - 皎月女神 - 黛安娜，133 - 德玛西亚之翼 - 奎因，134 - 暗黑元首 - 辛德拉，

136 - 铸星龙王 - 奥瑞利安·索尔，143 - 荆棘之兴 - 婕拉，150 - 迷失之牙 - 纳尔，154 - 生化魔人 - 扎克，157 - 疾风剑豪 - 亚索，

161 - 虚空之眼 - 维克兹，163 - 岩雀 - 塔莉垭，201 - 弗雷尔卓德之心 - 布隆，202 - 戏命师 - 烬，203 - 永猎双子 - 千珏，

222 - 暴走萝莉 - 金克丝，223 - 河流之王 - 塔姆，236 - 圣枪游侠 - 卢锡安，238 - 影流之主 - 劫，245 - 时间刺客 - 艾克，

254 - 皮城执法官 - 蔚，266 - 暗裔剑魔 - 亚托克斯，267 - 唤潮鲛姬 - 娜美，268 - 沙漠皇帝 - 阿兹尔，412 - 魂锁典狱长 - 锤石，

420 - 海兽祭司 - 俄洛伊，421 - 虚空遁地兽 - 雷克塞，429 - 复仇之矛 - 卡莉丝塔，432 - 星界游神 - 巴德

本地：

将launch.js放置于英雄联盟安装目录，如“E:\腾讯游戏\英雄联盟”，执行以下命令即可观看对应的比赛OB：

node launch.js 通讯密钥(ek) 比赛ID(gid) 游戏平台ID(pid)

