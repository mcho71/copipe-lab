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

  @AuraEnabled
  public static void publishViewing(
    String userId,
    String action,
    String pageReferenceJson,
    String pageTitle
  ) {
    ViewingMemberEvent__e event = new ViewingMemberEvent__e(
      UserId__c = userId,
      Action__c = action,
      PageReferenceJson__c = pageReferenceJson,
      PageTitle__c = pageTitle
    );
    EventBus.publish(event);
  }
}
