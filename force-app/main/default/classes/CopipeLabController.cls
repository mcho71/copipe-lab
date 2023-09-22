public with sharing class CopipeLabController {
  @AuraEnabled(cacheable=true)
  public static CopipeLab__c[] getRecords() {
    return [SELECT Id, Name FROM CopipeLab__c];
  }
}
