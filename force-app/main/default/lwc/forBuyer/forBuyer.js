import { LightningElement, api, track, wire } from 'lwc';
import getBuyerDetails from '@salesforce/apex/Buyer.getBuyerDetails';
import { CurrentPageReference } from 'lightning/navigation';
import getPicklistValues from '@salesforce/apex/PicklistController.getPicklistValues';
import getMatchingSellers from '@salesforce/apex/Buyer.getMatchingSellers';
import savePotentialBuyerSeller from '@salesforce/apex/Buyer.savePotentialBuyerSeller';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class ForBuyer extends NavigationMixin(LightningElement) {
    @api recordId;
    @track buyer = {};
    @track preferredCarCompany = '';
    @track preferredCarModel = '';
    @track color = '';
    @track kmRange = 1;
    @track fuelType = '';
    @track yearRange = 2025;
    @track budgetMin;
    @track budgetMax;
    @track buyerName = '';

    @track carCompanyOptionsPickList = [];
    @track fuelTypeOptionsPickList = [];
    @track colorOptionsPickList = [];
    @track carModelOptionsPickList = [];

    @track filters = {
        preferredCarCompany: '',
        preferredCarModel: '',
        color: '',
        kmRange: 1,
        fuelType: '',
        yearRange: 2025,
        budgetMin: 0,
        budgetMax: 0
    };

    @track matchingSellers = [];

    @track showModal2 = true;

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.recordId = currentPageReference.state.recordId;
        }
    }

    sellerColumns = [
        { 
            label: 'Seller Name', 
            fieldName: 'sellerUrl', 
            type: 'url',
            typeAttributes: { 
                label: { fieldName: 'sellerName' }, 
                target: '_blank' 
            }, 
            initialWidth: 250,
            sortable: true
        },
        { label: 'Email', fieldName: 'email', type: 'email', initialWidth: 250, sortable: true  },
        { label: 'Phone', fieldName: 'phone', type: 'phone', initialWidth: 150, sortable: true  },
        { label: 'Car Company', fieldName: 'carCompany', type: 'text', initialWidth: 150, sortable: true  },
        { label: 'Car Model', fieldName: 'carModel', type: 'text', initialWidth: 150, sortable: true  },
        { label: 'Color', fieldName: 'color', type: 'text', initialWidth: 150, sortable: true  },
        { label: 'Kilometers Driven', fieldName: 'kmDriven', type: 'number', initialWidth: 150, sortable: true  },
        { label: 'Fuel Type', fieldName: 'fuelType', type: 'text', initialWidth: 150, sortable: true  },
        { label: 'Year of Manufacture', fieldName: 'year', type: 'number', initialWidth: 150, sortable: true  }
    ];

    connectedCallback(){
        console.log('Record ID:', this.recordId);
        if (this.recordId) {
            console.log('Record ID:', this.recordId);
            this.fetchBuyerDetails();
            this.fetchPicklistValues();
        }
    }

    renderedCallback() {
        if (!this.template.querySelector('style[data-id="modal-style"]')) {
            const STYLE = document.createElement('style');
            STYLE.setAttribute('data-id', 'modal-style');
            STYLE.textContent = `
                .uiModal--medium .modal-container {
                    width: 90% !important;
                    height: 200% !important;
                    max-width: 100%;
                    min-width: 480px;
                    max-height: 100%;
                    min-height: 480px;
                }
            `;
            this.template.appendChild(STYLE); // append to template instead of lightning-card
        }
    }
    

    fetchBuyerDetails() {
        getBuyerDetails({ buyerId: this.recordId })
            .then(result => {
                this.buyer = result;
                console.log('Buyer Details:', JSON.stringify(this.buyer));
                this.preferredCarCompany = this.buyer.preferredCar;
                this.preferredCarModel = this.buyer.preferredModel;
                this.color = this.buyer.color;
                this.kmRange = this.buyer.kmDrivenMax;
                this.fuelType = this.buyer.fuelTypePreference;
                this.yearRange = this.buyer.yearRange;
                this.budgetMin = this.buyer.budgetMin;
                this.budgetMax = this.buyer.budgetMax;
                this.buyerName = this.buyer.name;
                console.log('Buyer Name:', this.buyerName);
                console.log('Budget Min:', this.budgetMin);
                console.log('Budget Max:', this.budgetMax);
                console.log('Preferred Car Company:', this.preferredCarCompany);
                console.log('Preferred Car Model:', this.preferredCarModel);
                console.log('Color:', this.color);
                console.log('KM Range:', this.kmRange);
                console.log('Fuel Type:', this.fuelType);
                console.log('Year Range:', this.yearRange);

                this.fetchMatchingSellers();
            })
            .catch(error => {
                console.error('Error in fetching buyer details:', error);
                this.showToast('Error', 'Failed to fetch buyer details', 'error',   'dismissible');
            });
    }

    fetchMatchingSellers() {
        getMatchingSellers({
            preferredCarCompany: this.preferredCarCompany,
            preferredCarModel: this.preferredCarModel,
            color: this.color,
            kmRange: this.kmRange,
            fuelType: this.fuelType,
            yearRange: this.yearRange,
            budgetMin: this.budgetMin,
            budgetMax: this.budgetMax
        })
            .then(result => {
                // Transform the data for the datatable with required fields
                this.matchingSellers = result.map(seller => {
                    return {
                        id: seller.Id,
                        sellerName: seller.Name,
                        sellerUrl: '/' + seller.Id, // Creates a relative URL to the record
                        email: seller.Email,
                        phone: seller.Phone,
                        carCompany: seller.Company__c,
                        carModel: seller.Car_Model__c,
                        color: seller.Color__c,
                        kmDriven: seller.Kilometers_Driven__c,
                        fuelType: seller.Fuel_Type__c,
                        year: seller.Year_of_Manufacture__c
                    };
                });
                console.log('Transformed Matching Sellers:', JSON.stringify(this.matchingSellers));
            })
            .catch(error => {
                console.error('Error in fetching matching sellers:', error);
                this.showToast('Error', 'Failed to fetch matching sellers', 'error', 'dismissible');
            });
    }

    fetchPicklistValues() {
        this.fetchPicklist('Lead', 'Preferred_Car__c').then(result => {
            this.carCompanyOptionsPickList = result;
        });

        this.fetchPicklist('Lead', 'Fuel_Type__c').then(result => {
            this.fuelTypeOptionsPickList = result;
        });

        this.fetchPicklist('Lead', 'Color__c').then(result => {
            this.colorOptionsPickList = result;
        });

        this.fetchPicklist('Lead', 'Preferred_Model__c').then(result => {
            this.carModelOptionsPickList = result;
        });
    }

    // Helper function to fetch picklist values
    fetchPicklist(objectName, fieldName) {
        return getPicklistValues({ objectName: objectName, fieldName: fieldName })
            .then(result => {
                return result;
            })
            .catch(error => {
                console.error('Error fetching picklist values:', error);
                return [];
            });
    }
    
    handleBudgetMinChange(event) {
        this.budgetMin = event.target.value;
    }

    handleBudgetMaxChange(event) {
        this.budgetMax = event.target.value;
    }

    handleCarCompanyChange(event) {
        this.preferredCarCompany = event.target.value;
    }

    handleCarModelChange(event) {
        this.preferredCarModel = event.target.value;
    }

    handleColorChange(event) {
        this.color = event.target.value;
    }

    handleKmRangeChange(event) {
       this.kmRange = event.target.value;
    }

    handleFuelTypeChange(event) {
        this.fuelType = event.target.value;
    }

    handleYearRangeChange(event) {
       this.yearRange = event.target.value;
    }

    applyFilters() {
        this.filters = {
            preferredCarCompany: this.preferredCarCompany,
            preferredCarModel: this.preferredCarModel,
            color: this.color,
            kmRange: this.kmRange,
            fuelType: this.fuelType,
            yearRange: this.yearRange,
            budgetMin: this.budgetMin,
            budgetMax: this.budgetMax
        };
        
        console.log('Applied Filters:', this.filters);
        this.fetchMatchingSellers();   
    }

    @track selectedRows = [];
    @track selectedSellerIds = [];
    @track accumulatedSelectedRows = [];

    handleRowSelection(event) {
        // Get current selected rows from the datatable
        const currentSelectedRows = event.detail.selectedRows;
        
        // Create a map of IDs for easy lookup
        const selectedRowsMap = new Map();
        currentSelectedRows.forEach(row => {
            selectedRowsMap.set(row.id, row);
        });
        
        // Update the accumulated selected rows based on the current selection
        // This will contain only the currently selected rows
        this.accumulatedSelectedRows = Array.from(selectedRowsMap.values());
        
        // Update the selectedSellerIds based on the current selection
        this.selectedSellerIds = this.accumulatedSelectedRows.map(row => row.id);
        
        console.log('Selected Rows:', JSON.stringify(this.accumulatedSelectedRows));
        console.log('Selected Seller IDs:', JSON.stringify(this.selectedSellerIds));
    }

    get isSelectionEmpty() {
        return !this.selectedSellerIds.length;
    }

    // Close the modal
    closeModal() {
        this.showModal2 = false;
      
        // Also try manually removing any added DOM
        const modalEl = this.template.querySelector('.slds-modal');
        const backdropEl = this.template.querySelector('.slds-backdrop');
      
        if (modalEl) {
          modalEl.classList.remove('slds-fade-in-open');
        }
        if (backdropEl) {
          backdropEl.classList.remove('slds-backdrop_open');
        }

        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Lead',
                actionName: 'view'
            }
        });
      }
      
    

    // Save the selected sellers
    handleSave() {
        if (this.selectedSellerIds.length === 0) {
            this.showToast('Warning', 'Please select at least one seller', 'warning', 'dismissible');
            return;
        }

        
        // Create records for each selected seller
        const promises = this.selectedSellerIds.map(sellerId => {
            const seller = this.accumulatedSelectedRows.find(row => row.id === sellerId);
            return this.createPotentialBuyerSellerRecord(sellerId, seller.sellerName);
        });

        

        // Wait for all records to be created
        Promise.all(promises)
            .then(() => {
                this.showToast('Success', 'Potential Buyer-Seller records created successfully', 'success', 'dismissible');
                this.closeModal();
            })
            .catch(error => {
                console.error('Error creating records:', error);
                this.showToast('Error', 'Failed to create records: ' + error.message, 'error', 'dismissible');
            });
    }

    // Create a single potential buyer-seller record
    createPotentialBuyerSellerRecord(sellerId, sellerName) {
        return savePotentialBuyerSeller({
            buyerId: this.recordId,
            buyerName: this.buyerName,
            sellerId: sellerId,
            sellerName: sellerName
        });
    }

    // Show toast message
    showToast(title, message, variant, mode) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant, 
                mode: mode
            })
        );
    }
}