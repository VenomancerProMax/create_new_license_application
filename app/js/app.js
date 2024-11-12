ZOHO.embeddedApp.on("PageLoad", entity => {
    var entity_id = entity.EntityId[0];
    ZOHO.CRM.API.getRecord({Entity: "Quotes", approved: "both", RecordID: entity_id})
    .then(function(data){
        const quoteData = data.data[0];

        const recordDetails = {
            "Account_Name": quoteData.Account_Name.id,
            "Deal_Name": quoteData.Deal_Name.id,
            "Owner": quoteData.Owner.id,
            "Contact_Name": quoteData.Contact_Name.id
        };

        console.log("Record Data", recordDetails);
    }).catch(function(error){
        console.log("Error fetching record:", error);
    });
});

ZOHO.embeddedApp.init();
