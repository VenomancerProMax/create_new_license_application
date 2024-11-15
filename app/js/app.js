let quoteName, quoteId, accountName, accountId, contactName, contactId, prospectName, prospectId;
let formData = {};
let applicationId = "";

// Fetching data from the Quotes entity
ZOHO.embeddedApp.on("PageLoad", entity => {
    var entity_id = entity.EntityId[0];
    ZOHO.CRM.API.getRecord({ Entity: "Quotes", approved: "both", RecordID: entity_id })
    .then(function(data) {
        const quoteData = data.data;
        quoteData.map((data) => {
            quoteName = data.Owner.name;
            quoteId = data.Owner.id;
            accountId = data.Account_Name.id;
            accountName = data.Account_Name.name;
            contactId = data.Contact_Name.id;
            contactName = data.Contact_Name.name;
            prospectId = data.Deal_Name.id;
            prospectName = data.Deal_Name.name;
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
        "License_Jurisdiction": formData.License_Authority,
        // "Office_Type": formData.Office_Type,
        // "Company_Formation_Type": formData.Company_Formation_Type,
    };

    // Insert the record in Applications1
    ZOHO.CRM.API.insertRecord({ Entity: "Applications1", APIData: recordData, Trigger: ["workflow"] })
    .then(function(response1) {
        const applicationData = response1.data;
        applicationData.map((record) => {
            const applicationId = record.details.id;

            // Prepare data for the related list record
            var recordAppData = {
                "Status": "In-Progress",
                "Share_Value": formData.Share_Value,
                "License_Package": formData.Visa_Quota,
                "New_License_Application": applicationId,
                "Application_Jurisdiction": formData.License_Authority,
                "Total_Share_Capital": formData.Proposed_Share_Capital
            };

            // Insert record in related list module
            ZOHO.CRM.API.insertRecord({ Entity: "New_License_Forms", APIData: recordAppData, Trigger: ["workflow"] })
                .then(function(response2) {
                    const relatedData = response2.data;
                    relatedData.map((relatedRecord) => {
                        console.log("Related Record Created:", relatedRecord);
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
