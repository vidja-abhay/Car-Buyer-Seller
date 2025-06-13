public class Buyer {
    
    // Wrapper class to hold buyer details
    public class BuyerWrapper {
        @AuraEnabled public Id buyerId;
        @AuraEnabled public Decimal budgetMin;
        @AuraEnabled public Decimal budgetMax;
        @AuraEnabled public String fuelTypePreference;
        @AuraEnabled public Decimal kmDrivenMin;
        @AuraEnabled public Decimal kmDrivenMax;
        @AuraEnabled public String color;
        @AuraEnabled public String preferredModel;
        @AuraEnabled public String preferredCar;
        @AuraEnabled public Decimal yearRange;
        @AuraEnabled public String name;
    }

    @AuraEnabled
    public static BuyerWrapper getBuyerDetails(Id buyerId) {
        try {
            Lead buyer = [
                SELECT Id, Name, Budget_Min__c, Budget_Max__c, Fuel_Type_Preference__c,
                       Km_Driven_Min__c, Km_Driven_Max__c, Color__c,
                       Preferred_Model__c, Preferred_Car__c, Preferred_Year_Range__c
                FROM Lead
                WHERE Id = :buyerId
                LIMIT 1
            ];

            // Map Lead fields into Wrapper
            BuyerWrapper wrapper = new BuyerWrapper();
            wrapper.buyerId = buyer.Id;
            wrapper.budgetMin = buyer.Budget_Min__c;
            wrapper.budgetMax = buyer.Budget_Max__c;
            wrapper.fuelTypePreference = buyer.Fuel_Type_Preference__c;
            wrapper.kmDrivenMin = buyer.Km_Driven_Min__c;
            wrapper.kmDrivenMax = buyer.Km_Driven_Max__c;
            wrapper.color = buyer.Color__c;
            wrapper.preferredModel = buyer.Preferred_Model__c;
            wrapper.preferredCar = buyer.Preferred_Car__c;
            wrapper.yearRange = buyer.Preferred_Year_Range__c;
            wrapper.name = buyer.Name;

            System.debug('Buyer details fetched successfully: ' + wrapper);

            return wrapper;

        } catch (Exception e) {
            System.debug('Error fetching buyer details: ' + e.getMessage());
            return null;
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Lead> getMatchingSellers(
        String preferredCarCompany,
        String preferredCarModel,
        String color,
        String fuelType,
        Integer kmRange,
        Integer yearRange,
        Decimal budgetMin,
        Decimal budgetMax
    ) {
        System.debug('Matching sellers for the given filter criteria:');
        System.debug('Preferred Car Company: ' + preferredCarCompany);
        System.debug('Preferred Car Model: ' + preferredCarModel);
        System.debug('Color: ' + color);
        System.debug('Fuel Type: ' + fuelType);
        System.debug('Kilometers Range: ' + kmRange);
        System.debug('Year Range: ' + yearRange);
        System.debug('Budget Min: ' + budgetMin);
        System.debug('Budget Max: ' + budgetMax);
        
        // Get the Seller record type ID
        Id sellerRecordTypeId = Schema.SObjectType.Lead.getRecordTypeInfosByDeveloperName().get('Seller').getRecordTypeId();
        
        // Validate input parameters
        if (budgetMin > budgetMax) {
            // System.debug('Budget Minimum should be greater than Budget Maximum. Ignoring input values!');
            return new List<Lead>();
        } 
        
        return [
            SELECT Name, Email, Phone, Street, City, State, PostalCode, Company__c, Car_Model__c, Color__c, 
                Fuel_Type__c, Kilometers_Driven__c, Year_of_Manufacture__c, Price__c
            FROM Lead
            WHERE RecordTypeId = :sellerRecordTypeId
            AND (Company__c = :preferredCarCompany
                AND Car_Model__c = :preferredCarModel
                AND Color__c = :color
                AND Fuel_Type__c = :fuelType
                AND Kilometers_Driven__c < :kmRange
                AND Year_of_Manufacture__c > :yearRange
                AND (Price__c < :budgetMax AND Price__c > :budgetMin))
        ];
    }

    @AuraEnabled
    public static Id savePotentialBuyerSeller(
        String buyerId, 
        String buyerName, 
        String sellerId, 
        String sellerName
    ) {
        try {
            // Create new Potential_Buyer_Seller__c record
            Potential_Buyer_Seller__c pbs = new Potential_Buyer_Seller__c(
                Name = sellerName, // Set name as seller's name since this is being created from buyer's perspective
                Potential_Buyer__c = buyerId,
                Potential_Seller__c = sellerId
            );
            
            insert pbs;
            
            return pbs.Id;
        } catch (Exception e) {
            
            System.debug('Error creating Potential_Buyer_Seller__c record: ' + e.getMessage());
            
            throw new AuraHandledException('Error creating record: ' + e.getMessage());
        }
    }

    public class PotentialBuyerSellerWrapper {
        @AuraEnabled public Id id;
        @AuraEnabled public String name;
        @AuraEnabled public Id potentialBuyerId;
        @AuraEnabled public Id potentialSellerId;
        @AuraEnabled public String potentialSellerName;
        @AuraEnabled public String potentialSellerEmail;
        @AuraEnabled public String potentialSellerPhone;
        @AuraEnabled public String color;
        @AuraEnabled public String carModel;
        @AuraEnabled public String fuelType;
        @AuraEnabled public String yearOfManufacture;
        @AuraEnabled public Decimal price;
        @AuraEnabled public String carCondition;
        @AuraEnabled public String carCompany;
        @AuraEnabled public String accidentHistory;
        @AuraEnabled public Decimal kilometersDriven;
        @AuraEnabled public String engineType;
        @AuraEnabled public Boolean interestedInExchange;
        @AuraEnabled public Date insuranceValidTill;
        @AuraEnabled public Boolean negotiable;
        @AuraEnabled public Boolean loan;
        @AuraEnabled public String registrationNumber;
    
        // Constructor to populate wrapper fields from SObject
        public PotentialBuyerSellerWrapper(Potential_Buyer_Seller__c record) {
            this.id = record.Id;
            this.name = record.Name;
            this.potentialBuyerId = record.Potential_Buyer__c;
            this.potentialSellerId = record.Potential_Seller__c;
            this.potentialSellerName = record.Potential_Seller__r != null ? record.Potential_Seller__r.Name : null;
            this.potentialSellerEmail = record.Potential_Seller__r != null ? record.Potential_Seller__r.Email : null;
            this.potentialSellerPhone = record.Potential_Seller__r != null ? record.Potential_Seller__r.Phone : null;
            this.color = record.Color__c;
            this.carModel = record.Car_Model__c;
            this.fuelType = record.Fuel_Type__c;
            this.yearOfManufacture = String.valueOf(record.Year_of_Manufacture__c);
            this.price = record.Price__c;
            this.carCondition = record.Car_Condition__c;
            this.carCompany = record.Car_Company__c;
            this.accidentHistory = record.Accident_History__c;
            this.kilometersDriven = record.Kilometers_Driven__c;
            this.engineType = record.Engine_Type__c;
            this.interestedInExchange = record.Interested_in_Exchange__c;
            this.insuranceValidTill = record.Insurance_Valid_Till__c;
            this.negotiable = record.Negotiable__c;
            this.loan = record.Loan__c;
            this.registrationNumber = record.Registration_Number__c;
        }
    }

    @AuraEnabled
    public static List<PotentialBuyerSellerWrapper> getPotentialBuyerSeller(Id buyerId) {
        List<PotentialBuyerSellerWrapper> results = new List<PotentialBuyerSellerWrapper>();

        try {
            List<Potential_Buyer_Seller__c> records = [
                SELECT Id, Name, Potential_Buyer__c, Potential_Seller__c,
                    Potential_Seller__r.Name, Potential_Seller__r.Email, Potential_Seller__r.Phone,
                    Color__c, Car_Model__c, Fuel_Type__c, Year_of_Manufacture__c, Price__c, Car_Condition__c,
                    Car_Company__c, Accident_History__c, Kilometers_Driven__c, Engine_Type__c, Interested_in_Exchange__c,
                    Insurance_Valid_Till__c, Negotiable__c, Loan__c, Registration_Number__c
                FROM Potential_Buyer_Seller__c
                WHERE Potential_Buyer__c = :buyerId
            ];

            for (Potential_Buyer_Seller__c rec : records) {
                results.add(new PotentialBuyerSellerWrapper(rec));
            }

            return results;
        } catch (Exception e) {
            System.debug('Error in getPotentialBuyerSeller: ' + e.getMessage());
        }

        return results;
    }

    @AuraEnabled
    public static List<String> getExistingPotentialSellerIds(Id buyerId) {
        List<String> existingSellerIds = new List<String>();
        
        try {
            List<Potential_Buyer_Seller__c> existingRecords = [
                SELECT Potential_Seller__c
                FROM Potential_Buyer_Seller__c
                WHERE Potential_Buyer__c = :buyerId
            ];
            
            for (Potential_Buyer_Seller__c record : existingRecords) {
                existingSellerIds.add(record.Potential_Seller__c);
            }
            
            return existingSellerIds;
        } catch (Exception e) {
            System.debug('Error getting existing potential seller IDs: ' + e.getMessage());
            return existingSellerIds;
        }
    }

}
