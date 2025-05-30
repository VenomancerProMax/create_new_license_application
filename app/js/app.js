
//Live - /widget.html
//Development - //https://127.0.0.1:5000/app/widget.html
let quoteId;
let accountId;
let formData = {};
let applicationId = "";
let new_license_id;
let prospectId;

// Function to display the custom alert
function showCustomAlert(message) {
    const alertBox = document.getElementById("custom-alert");
    const alertMessage = alertBox.querySelector("p");
    alertMessage.textContent = message;
    alertBox.classList.remove("hidden");
}

// Function to hide the custom alert
function hideCustomAlert() {
    const alertBox = document.getElementById("custom-alert");
    alertBox.classList.add("hidden");
}

// ====================================================================== //
let isNewTradeLicense = false;
let isProductDetailsValid = false;
let type = "";
// ====================================================================== //

// Fetching data from the Quotes entity
ZOHO.embeddedApp.on("PageLoad", entity => {
    let entity_id = entity.EntityId[0];
    
    ZOHO.CRM.API.getRecord({ Entity:"Quotes", approved:"both",RecordID: entity_id })
    .then(function(data) {
        const quoteData = data.data;
        quoteData.map((data) => {
            quoteId = data.id;
            accountId = data.Account_Name.id;
            prospectId = data.Deal_Name.id;
            console.log("PROSPECT ID 1: " + prospectId)

            const productDetails = data.Product_Details || [];
            console.log(productDetails);
            
            const requiredItems = [
                { name: "SPC | Pre approval" },
                { name: "KIZAD Pre Approval" },
                { name: "SHAMS | License Pre-Approval" },
                { name: "IFZA License Pre-Approval" },
                { name: "Ajman Immigration Security Approval" },
                { name: "RAKEZ Security Approval for Shareholders" },
            ];
            
            // ====================================================================== //
            // Check if any product in Product_Details matches the requiredItems
            isProductDetailsValid = productDetails.some(item => 
                requiredItems.some(requiredItem => 
                    item.product && item.product.name && item.product.name.trim() === requiredItem.name
                )
            );
            
            console.log(isProductDetailsValid); // This should now correctly log 'true' or 'false'
            

            // ====================================================================== //

            createNewLicenseApplication = data.Create_New_License_Application;
            // Check if Create_New_License_Application is TRUE
            if (createNewLicenseApplication === true) {
                const submitButton = document.getElementById("submit_button_id");
                submitButton.disabled = true;
                submitButton.style.backgroundColor = "#D3D3D3";
                showCustomAlert("Record has already been created. Close the form to exit.");
            } else {
                const submitButton = document.getElementById("submit_button_id");
                submitButton.disabled = false;
                submitButton.style.backgroundColor = "";
                hideCustomAlert();
            }
        });
       //Prospects
        console.log("Final Prospect ID: " + prospectId )
        console.log("Entity ID: " + entity_id)
        ZOHO.CRM.API.getRecord({ Entity:"Deals", RecordID:prospectId })
        .then(function(data) {
            
            const prospectData = data.data;
            prospectData.map((data) => {
                let prospect_type = data.Type;
                console.log("Prospect Type: " + prospect_type)

                // Validation of Prospect Type. It will only accept New Trade License and Pre-Approval
                if (prospect_type !== "New Trade License" && prospect_type !== "Pre-Approval") {
                    const submitButton = document.getElementById("submit_button_id");
                    submitButton.disabled = true;
                    submitButton.style.backgroundColor = "#D3D3D3";
                    showCustomAlert("This quote is not associated to New Trade License or Pre-Approval. Close the form to exit.");
                }

                // ====================================================================== //
                if (prospect_type === "New Trade License") {
                    type = isProductDetailsValid ? "Pre-Approval" : "New Trade License";
                } else if (prospect_type === "Pre-Approval") {
                    type = "Pre-Approval";
                }
                
                console.log("Final Type: " + type);
                console.log(isProductDetailsValid);
                
                // ====================================================================== //
            });
        });
    });
});

// Collecting form data
function collectFormData() {
    formData = {
        License_Authority: document.getElementById("license-authority").value,
        Company_Formation_Type: document.getElementById("company-formation-type").value,
        Office_Type: document.getElementById("office-type").value,
        Visa_Quota: document.getElementById("visa-quota").value,
        Proposed_Share_Capital: document.getElementById("proposed-share-capital").value,
        Share_Value: document.getElementById("share-value").value
    };
}

document.addEventListener("DOMContentLoaded", function () {
    const licenseAuthoritySelect = document.getElementById("license-authority");
    const companyFormationSelect = document.getElementById("company-formation-type");

    // Store the "General Freelance" option separately to add it back later huhu
    const generalFreelanceOption = [...companyFormationSelect.options].find(option => option.value === "General Freelance");

    function toggleGeneralFreelanceOption() {
        const selectedAuthority = licenseAuthoritySelect.value;

        // Remove it if exists
        [...companyFormationSelect.options].forEach(opt => {
            if (opt.value === "General Freelance") {
                opt.remove();
            }
        });

        // ONLY ADD if Ajman Free Zone is selected
        if (selectedAuthority === "Ajman Free Zone") {
            companyFormationSelect.appendChild(generalFreelanceOption);
        }
    }

    licenseAuthoritySelect.addEventListener("change", toggleGeneralFreelanceOption);
    toggleGeneralFreelanceOption();
});


// Custom confirm function
function showConfirmation(message, onConfirm, onCancel) {
    const dialog = document.getElementById("confirmation-dialog");
    const messageBox = document.getElementById("confirmation-message");
    const confirmBtn = document.getElementById("confirm-button");
    const cancelBtn = document.getElementById("cancel-button");

    messageBox.textContent = message;
    dialog.classList.remove("hidden");

    confirmBtn.onclick = () => {
        dialog.classList.add("hidden");
        console.log("User confirmed");
        if (onConfirm) onConfirm();
    };

    cancelBtn.onclick = () => {
        dialog.classList.add("hidden");
        if (onCancel) onCancel();
        // ZOHO.CRM.UI.Popup.close();
    };
}

let isSubmitting = false;
// Main form submission logic
function create_record(event) {
    event.preventDefault();

    if (isSubmitting) {
        console.log("Submission already in progress.");
        return;
    }

    isSubmitting = true;

    collectFormData();

    const licenseAuthority = formData.License_Authority;
    const shareCapital = parseFloat(formData.Proposed_Share_Capital || 0);

    if (licenseAuthority === "International Free Zone Authority" && shareCapital >= 48000) {
        showConfirmation(
            "The Total share capital is AED48,000 and above. It is a suspected investor visa application. Can you make sure to check the quote whether the BSC has the correct charges in line of the client's requirement?",
            () => proceedWithRecordCreation(),
            () => {
                console.log("User cancelled submission.");
                isSubmitting = false;
            }
        );
    } else {
        proceedWithRecordCreation();
    }
}

// Separated logic to handle actual record creation
function proceedWithRecordCreation() {
    // Update Quotes
    var updateQuotes = {
        Entity: "Quotes",
        APIData: {
            "id": quoteId,
            "Create_New_License_Application": true
        }
    };
    ZOHO.CRM.API.updateRecord(updateQuotes)
    .then(function(data) {
        console.log("QUOTE DATA UPDATED: ", data);
    });

    let email = "";
    if (formData.License_Authority === "Ajman Free Zone" || formData.License_Authority === "Ajman Media City Free Zone") {
        email = "opsn@uaecsp.club";
    } else if (formData.License_Authority === "International Free Zone Authority") {
        email = "partner@ifza.com";
    } else if (formData.License_Authority === "Sharjah Media City") {
        email = "safwan.m@scs.shams.ae";
    } else {
        email = "operations@tlz.ae";
    }

    var recordData = {
        "Authority_Email_Address": email,
        "Deal_Name": prospectId,
        "Status": "In-Progress",
        "Account_Name": accountId,
        "Type": type,
        "License_Package": formData.Visa_Quota,
        "License_Jurisdiction": formData.License_Authority,
        "Layout": "3769920000104212264",
        "AML_Connected": true,
        "New_Resident_Visa_Stage": "Start"
    };

    ZOHO.CRM.API.insertRecord({
        Entity: "Applications1",
        APIData: recordData
    }).then(function(response1) {
        const applicationData = response1.data;
        applicationData.map((record) => {
            const applicationId = record.details.id;

            var recordNewLicenseData = {
                "New_License_Application_Type": "New",
                "Status": "In-Progress",
                "Share_Value": formData.Share_Value,
                "License_Package": formData.Visa_Quota,
                "New_License_Application": applicationId,
                "Application_Jurisdiction": formData.License_Authority,
                "Total_Share_Capital": formData.Proposed_Share_Capital,
                "Facility_Type": formData.Office_Type,
                "Legal_Type": formData.Company_Formation_Type,
                "AML_Connected": true,
                "Layout": "3769920000261689839",
                "Application_Stage": "Start",
                "Application_Type": type,
                // "Owner":"3769920000000662004",
                "Application_Status": "In-Progress"
            };

            ZOHO.CRM.API.insertRecord({
                Entity: "New_License_Forms",
                APIData: recordNewLicenseData
            }).then(function(response2) {
                const relatedData = response2.data;
                relatedData.map((relatedRecord) => {
                    new_license_id = relatedRecord.details.id;
                    let new_license_url = "https://crm.zoho.com/crm/org682300086/tab/CustomModule3/" + applicationId;
                    window.open(new_license_url, '_blank').focus();
                    const submitButton = document.getElementById("submit_button_id");
                    submitButton.disabled = true;
                    submitButton.style.backgroundColor = "#D3D3D3";
                    showCustomAlert("Application Record created. Please close the form.");
                });
            }).catch(function(error) {
                console.error("Error inserting related record:", error);
            });
        });
    }).catch(function(error) {
        console.error("Error inserting main record:", error);
    });
}

// Event listener for form submission
document.getElementById("record-form").addEventListener("submit", create_record);

// Initialize the embedded app
ZOHO.embeddedApp.init();
