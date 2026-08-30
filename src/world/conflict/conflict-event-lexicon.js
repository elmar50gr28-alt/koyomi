export const CONFLICT_EVENT_LEXICON_VERSION='conflict-event-lexicon-v1.0';

const entry=(eventId,title,tags,manifestations,focus,direction)=>Object.freeze({eventId,title,tags:Object.freeze(tags),manifestations:Object.freeze(manifestations),focus:Object.freeze(focus),direction});

export const ASPECT_EVENTS=Object.freeze({
  'Mars-Saturn':entry('prolonged-pressure','封鎖や制裁を伴う長期的な圧力',['圧力','長期化','交渉停滞'],['制限措置の強化','停戦・合意形成の停滞','物流や移動をめぐる締め付け'],['物流・海上交通','外交交渉'],'膠着へ傾きやすい'),
  'Mars-Uranus':entry('sudden-demonstration','突発的な示威行動や技術的混乱',['突発変化','示威行動','通信障害'],['急な警戒態勢の強化','無人機などを用いた示威','通信・サイバー面の混乱'],['航空・周辺海域','通信網'],'短期間に変化しやすい'),
  'Mars-Pluto':entry('power-escalation','強硬な権力闘争と圧力の拡大',['権力闘争','強硬姿勢','拡大'],['統治をめぐる強硬な駆け引き','対立陣営への圧力強化','既存の力関係を変える動き'],['行政・統治','エネルギー供給'],'拡大へ傾きやすい'),
  'Saturn-Uranus':entry('institutional-disruption','現状維持と急変要求の衝突',['制度混乱','規制','突発変化'],['制度変更をめぐる対立','規制強化への反発','既存秩序を揺さぶる急な決定'],['行政制度','社会基盤'],'緊張と反動を繰り返しやすい'),
  'Mercury-Mars':entry('rhetorical-confrontation','強硬声明と外交的応酬',['声明','外交対立','情報'],['非難声明の応酬','交渉の中断や条件の引き上げ','報道・通信を通じた圧力'],['外交経路','情報・通信'],'交渉と対立が交錯しやすい'),
  'Jupiter-Pluto':entry('international-expansion','同盟国や国際機関を巻き込む広域化',['国際介入','同盟拡大','広域化'],['周辺国による関与の拡大','国際機関での議論の活発化','支援・制裁枠組みの再編'],['同盟・国際関係','広域物流'],'地域外へ波及しやすい'),
  'Neptune-Mars':entry('information-confusion','情報戦や誤認を伴う緊張',['情報混乱','秘密交渉','代理勢力'],['真偽の確認しにくい情報の拡散','非公式な交渉や秘密活動','代理的な勢力を介した圧力'],['情報・通信','海上交通'],'見通しが曖昧なまま続きやすい')
});

export const ANGULAR_EVENTS=Object.freeze({
  Mars:entry('regional-demonstration','地域軸で強まる示威と対立',['示威行動','強硬姿勢'],['演習や警戒態勢の強化','国境・周辺海域での応酬','強硬姿勢を示す動き'],['国境・周辺海域','航空圏'],'緊張が表面化しやすい'),
  Saturn:entry('regional-restriction','地域軸で強まる制限と停滞',['規制','停滞'],['移動・物流への制限','交渉日程の遅延','長期的な圧力'],['物流・海上交通','外交交渉'],'膠着が続きやすい'),
  Uranus:entry('regional-disruption','地域軸で起こる急変と混乱',['突発変化','通信障害'],['急な政策転換','通信・交通の一時的混乱','予想外の示威行動'],['通信網','航空・交通'],'急変しやすい'),
  Neptune:entry('regional-ambiguity','地域軸で深まる情報の混乱',['情報混乱','不透明化'],['相反する発表の増加','非公式情報の拡散','交渉経路の不透明化'],['情報・通信','外交経路'],'状況判断が難しくなりやすい'),
  Pluto:entry('regional-power-shift','地域軸で進む権力構造の再編',['権力闘争','体制再編'],['指導部内の力関係の変化','統治方針の強硬化','対立構造の組み替え'],['行政・統治','エネルギー供給'],'大きな再編へ傾きやすい')
});
