let quoteId, accountId, prospectId;
let formData = {};
let applicationId = "";

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


// Fetching data from the Quotes entity
ZOHO.embeddedApp.on("PageLoad", entity => {
    var entity_id = entity.EntityId[0];
    ZOHO.CRM.API.getRecord({ Entity: "Quotes", approved: "both", RecordID: entity_id })
    .then(function(data) {
        const quoteData = data.data;
        quoteData.map((data) => {
            quoteId = data.id;
            accountId = data.Account_Name.id;
            prospectId = data.Deal_Name.id;

            console.log("DATA 1: ", data);

            // Function to display the custom alert
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

// Creating a new record in Applications1
function create_record(event) {
    // Update Quotes Record set Create New License Application check box to true
    var updateQuotes={
            Entity: "Quotes", 
            APIData: {
                "id": quoteId,
                "Create_New_License_Application": true
          }, 
            Trigger:["workflow"]
        }
        ZOHO.CRM.API.updateRecord(updateQuotes)
        .then(function(data){
        console.log("QUOTE DATA UPDATED: ", data)
    })

    event.preventDefault();
    // Collect form data
    collectFormData();
    
    let email = "";
    // Use if-else to set email based on License Authority
    if (formData.License_Authority === "Ajman Free Zone" || formData.License_Authority === "Ajman Media City Free Zone") {
            email = "opsn@uaecsp.club";
        } else if (formData.License_Authority === "International Free Zone Authority") {
            email = "partner@ifza.com";
        } else if (formData.License_Authority === "Meydan Free Zone") {
            email = "operations@tlz.ae";
        } else if (formData.License_Authority === "Sharjah Media City") {
            email = "safwan.m@scs.shams.ae";
        } else {
            email = "operations@tlz.ae";
    }

    // Define the data to insert, combining form data and fetched quote data
    var recordData = {
        "Email": email,
        "Deal_Name": prospectId,
        "Status": "In-Progress",
        "Account_Name": accountId,
        "Type": "New Trade License",
        "License_Package": formData.Visa_Quota,
        "License_Jurisdiction": formData.License_Authority
    };

    // Insert the record in Applications1
    ZOHO.CRM.API.insertRecord({ Entity: "Applications1", APIData: recordData, Trigger: ["workflow"] })
    .then(function(response1) {
        const applicationData = response1.data;
        applicationData.map((record) => {
            const applicationId = record.details.id;

            // Prepare data for the related list record
            var recordNewLicenseData = {
                "Status": "In-Progress",
                "Share_Value": formData.Share_Value,
                "License_Package": formData.Visa_Quota,
                "New_License_Application": applicationId,
                "Application_Jurisdiction": formData.License_Authority,
                "Total_Share_Capital": formData.Proposed_Share_Capital,
                "Office_Type": formData.Office_Type,
                "Legal_Type": formData.Company_Formation_Type
            };

            // Insert record in related list module
            ZOHO.CRM.API.insertRecord({ 
                Entity: "New_License_Forms", 
                APIData: recordNewLicenseData
                // , Trigger: ["workflow"] 
            })
                .then(function(response2) {
                    const relatedData = response2.data;
                    relatedData.map((relatedRecord) => {
                        console.log("Related Record Created:", relatedRecord);  

                        // Disable the submit button and show the custom alert
                        const submitButton = document.getElementById("submit_button_id");
                        submitButton.disabled = true;
                        submitButton.style.backgroundColor = "#D3D3D3";
                        showCustomAlert("Application Record created. Please close the form.");
                    });
                })
                .catch(function(error) {
                    console.error("Error inserting related record:", error);
                });
        });
    })
    .catch(function(error) {
        console.error("Error inserting main record:", error);
    });
}

// Event listener for form submission
document.getElementById("record-form").addEventListener("submit", create_record);

// Initialize the embedded app
ZOHO.embeddedApp.init();
