var FS = FS || {};
FS.FieldServiceStatus = 690970004;
FS.saveHandler = null;
FS.RouteFeedOnSave =
{
    Onload: function () {
        MobileCRM.UI.EntityForm.onSave(FS.RouteFeedOnSave.onSaveValidation, true, null);
    },
    onSaveValidation: function (entityForm) {
        var entity = entityForm.entity;
        saveHandler = entityForm.suspendSave();
        var bookingid = entity.properties.iroc_bookingid.id;
        var bookableresourcebooking = new MobileCRM.DynamicEntity("bookableresourcebooking", bookingid);
        var updateResult = FS.RouteFeedOnSave.updateBRBStatus(bookableresourcebooking);
    },
    updateBRBStatus: function (bookableresourcebooking) {
        var entity = new MobileCRM.FetchXml.Entity("bookingstatus");
        entity.addAttributes("name");
        entity.addAttributes("bookstatusid");
        var filter = new MobileCRM.FetchXml.Filter();
        filter.where("msdyn_fieldservicestatus", "eq", FS.FieldServiceStatus);
        entity.filter = filter;
        var fetch = new MobileCRM.FetchXml.Fetch(entity);
        fetch.execute(
            "Array",
            function (result) {
                if (result.length == 0) { MobileCRM.bridge.alert("ERROR - Could not find booking status."); }
                else {
                    for (var i in result) {
                        var bookingstatus = result[i];
                        var bookingid = bookingstatus[0];
                        var bookingname = bookingstatus[6];
                    }
                    var status = new MobileCRM.Reference("bookingstatus", bookingid, bookingname);
                    bookableresourcebooking.properties["bookingstatus"] = status;
                    bookableresourcebooking.save(FS.RouteFeedOnSave.callBack);
                }
            },
            function (err) {
                MobileCRM.bridge.alert("An error occurred while updating booking status to BR: " + err);
            },
            null
        );
    },
    callBack: function (error) {
        if (error) {
            MobileCRM.bridge.alert("An error occurred while updating booking status to BR: " + error);
        }
        else {
            saveHandler.resumeSave();
            MobileCRM.bridge.raiseGlobalEvent("CompletedRouteFeedEvent", {
              testTitle: "true"
            });
  
        }
    }
}