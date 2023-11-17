public with sharing class PlatformEventService {
  @AuraEnabled
  public static void publish(String userId, String nickname, String message) {
    CopipeLabEvent__e event = new CopipeLabEvent__e(
      UserId__c = userId,
      NickName__c = nickname,
      Message__c = message
    );
    EventBus.publish(event);
  }
}
