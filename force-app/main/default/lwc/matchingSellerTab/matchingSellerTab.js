import { LightningElement, api, track, wire } from 'lwc';
import getBuyerDetails from '@salesforce/apex/Buyer.getBuyerDetails';
import getPotentialBuyerSeller from '@salesforce/apex/Buyer.getPotentialBuyerSeller';
import savePotentialBuyerSeller from '@salesforce/apex/Buyer.savePotentialBuyerSeller';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class MatchingSellerTab extends NavigationMixin(LightningElement) {
    @api recordId; // buyer Id
    @track buyerName = '';
    @track matchingSellers = [];
    @track isLoading = true;
    @track errorMessage;
    @track noRecords = false;
    @track allSelected = false;
    
    connectedCallback() {
        this.loadBuyerDetails();
        this.loadMatchingSellers();
    }
    
    loadBuyerDetails() {
        if (this.recordId) {
            getBuyerDetails({ buyerId: this.recordId })
                .then(result => {
                    if (result) {
                        this.buyerName = result.name;
                    }
                })
                .catch(error => {
                    this.errorMessage = 'Error loading buyer details: ' + this.reduceErrors(error);
                });
        }
    }
    
    loadMatchingSellers() {
        if (this.recordId) {
            getPotentialBuyerSeller({ buyerId: this.recordId })
                .then(result => {
                    if (result && result.length > 0) {
                        console.log('Matching sellers:', JSON.stringify(result));
                        this.matchingSellers = result.map((item, index) => {
                            // Format the numbers with commas
                            const formattedKM = parseInt(item.kilometersDriven).toLocaleString('en-IN');
                            const formattedPrice = '₹' + parseInt(item.price).toLocaleString('en-IN');
                            
                            return {
                                ...item,
                                url: '/lightning/r/Lead/' + item.potentialSellerId + '/view',
                                rowNumber: index + 1,
                                selected: false,
                                checkboxId: 'seller-checkbox-' + index,
                                rowClass: index % 2 === 0 ? 'slds-hint-parent' : 'slds-hint-parent table-row-alternate',
                                // Replace the original values with formatted ones
                                kilometersDriven: formattedKM,
                                price: formattedPrice
                            };
                        });
                        this.noRecords = false;
                    } else {
                        this.noRecords = true;
                    }
                    this.isLoading = false;
                })
                .catch(error => {
                    this.errorMessage = 'Error loading matching sellers: ' + this.reduceErrors(error);
                    this.isLoading = false;
                });
        }
    }
    
    handleNavigateToRecord(event) {
        const sellerId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: sellerId,
                objectApiName: 'Lead',
                actionName: 'view'
            }
        });
    }
    
    handleInterested(event) {
        const sellerId = event.currentTarget.dataset.id;
        const sellerName = event.currentTarget.dataset.name;
        
        console.log('Interested in seller:', sellerId, sellerName);

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Interested',
                message: 'You marked this seller as interested',
                variant: 'success'
            })
        );
    }
    
    handleNotInterested(event) {
        const sellerId = event.currentTarget.dataset.id;
        const sellerName = event.currentTarget.dataset.name;

        console.log('Not interested in seller:', sellerId, sellerName);
        
        // Here you could implement logic to mark as not interested
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Not Interested',
                message: 'You marked this seller as not interested',
                variant: 'info'
            })
        );
    }
    
    reduceErrors(errors) {
        if (!Array.isArray(errors)) {
            errors = [errors];
        }
        
        return errors
            .filter(error => !!error)
            .map(error => {
                if (typeof error === 'string') {
                    return error;
                } else if (error.message) {
                    return error.message;
                } else if (error.body && error.body.message) {
                    return error.body.message;
                } else {
                    return JSON.stringify(error);
                }
            })
            .join(', ');
    }
}