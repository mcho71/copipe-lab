public with sharing class PlatformEventService {
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
