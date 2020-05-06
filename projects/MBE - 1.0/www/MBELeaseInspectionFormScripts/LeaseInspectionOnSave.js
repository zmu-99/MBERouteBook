var FS = FS || {};
FS.LeaseInspectionCompleteStatusCode = 929530000;
FS.LeaseInspectionid = function(entityForm){ return  leaseInspectionId = entityForm.properties.iroc_leaseinspectionid; };
FS.saveHandler = null;
FS.LeaseInspectionOnSave = {
  Onload: function() {
    MobileCRM.UI.EntityForm.onSave(
      FS.LeaseInspectionOnSave.onSaveValidation,
      true,
      null
    );
  },
  onSaveValidation: function(entityForm) {
    var entity = entityForm.entity;
    saveHandler = entityForm.suspendSave();
    var irocLeaseInspectionid =
      entityForm.entity.properties.iroc_leaseinspectionid;
    var irocLeaseInspectionForm = new MobileCRM.DynamicEntity(
      "iroc_leaseinspection",
      irocLeaseInspectionid
    );
    var updateResult = FS.LeaseInspectionOnSave.updateLIStatus(
      irocLeaseInspectionForm
    );
  },
  updateLIStatus: function(irocLeaseInspectionForm) {

    irocLeaseInspectionForm.properties[
      "iroc_leaseinspectionstatus"
    ] = FS.LeaseInspectionCompleteStatusCode;
    irocLeaseInspectionForm.save(FS.LeaseInspectionOnSave.callBack);
  },
  callBack: function(error) {
    if (error) {
      MobileCRM.bridge.alert(
        "An error occurred while updating lease inspection status: " + error
      );
    } else {
      saveHandler.resumeSave();
      MobileCRM.bridge.raiseGlobalEvent("CompletedLeaseInspectionEvent", {
        testTitle: "true"
      });
    }
  }
};
