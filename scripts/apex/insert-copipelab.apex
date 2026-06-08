// CopipeLab__c のサンプルレコードを scratch 組織に投入する。
// 実行: sf apex run -f scripts/apex/insert-copipelab.apex -o copipe-lab-summer26
List<CopipeLab__c> records = new List<CopipeLab__c>{
  new CopipeLab__c(Name = 'hello world'),
  new CopipeLab__c(Name = 'copipe sample'),
  new CopipeLab__c(Name = 'Summer 26 demo'),
  new CopipeLab__c(Name = 'State Manager'),
  new CopipeLab__c(Name = 'LWC anagram'),
  new CopipeLab__c(Name = 'Lightning Local Dev'),
  new CopipeLab__c(Name = '残り3件'),
  new CopipeLab__c(Name = 'コピペ研究')
};
insert records;
System.debug('Inserted ' + records.size() + ' CopipeLab__c records.');
