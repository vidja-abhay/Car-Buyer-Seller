public with sharing class PicklistController {

    @AuraEnabled(cacheable=true)
    public static List<SelectOption> getPicklistValues(String objectName, String fieldName) {
        List<SelectOption> options = new List<SelectOption>();
        try {
            Schema.DescribeSObjectResult objResult = Schema.getGlobalDescribe().get(objectName).getDescribe();
            Schema.DescribeFieldResult fieldResult = objResult.fields.getMap().get(fieldName).getDescribe();
            
            List<Schema.PicklistEntry> picklistValues = fieldResult.getPicklistValues();
            
            for (Schema.PicklistEntry entry : picklistValues) {
                options.add(new SelectOption(entry.getLabel(), entry.getValue()));
            }
        } catch (Exception e) {
            System.debug('Error fetching picklist values: ' + e.getMessage());
        }
        return options;
    }
    
    public class SelectOption {
        @AuraEnabled public String label { get; set; }
        @AuraEnabled public String value { get; set; }
        
        public SelectOption(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }
}

