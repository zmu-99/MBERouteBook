// <reference path="jsbridge.js" />
var FS = FS || {};
FS.TableItemList = [];
FS.AllForemanGroups = [];
FS.SelectedForemanGroups = -1;
FS.CurrentUser = "";
FS.IsOnLine = false;
FS.SelectedToggle = false;
FS.Categories = [];
FS.btnclicked = false;
FS.MyNotif = {
    onloadFunction: function () {
        //Who is the current user?
        document.getElementById("loader").style.display = "block";
        document.getElementById("loadImage").style.display = "none";
        MobileCRM.Configuration.requestObject(
            function (config) {
                if (config.IsOnLine) {
                    FS.IsOnLine = true;
                }
                else {
                    FS.IsOnLine = false;
                }
                var settings = config.settings;
                FS.CurrentUser = settings.systemUserId;
                FS.MyNotif.getCategorys();
                return false;
            },
            function (err) {
                /// <param name="err" type="String">/<param>
                MobileCRM.bridge.alert("An error occurred: " + err);
            },
            null
        );
    },
    onClose: function () {
        document.getElementById("optionset").style.display = "block";
        document.getElementById("tablelist").style.display = "block";
        document.getElementById("loadImage").style.display = "none";
        document.getElementById("btnClose").style.display = "none";
        FS.btnclicked = false;
    },
    loadAttachment: function (noteid) {

        var imgElement = document.getElementById("img-result");
        MobileCRM.bridge.enableZoom(true);
        imgElement.setAttribute("src", "//:0");
        if (noteid.id != null) {
            document.getElementById("loader").style.display = "block";
            document.getElementById("optionset").style.display = "none";
            document.getElementById("tablelist").style.display = "none";
            document.getElementById("loadImage").style.display = "block";
            document.getElementById("btnClose").style.display = "block";
            MobileCRM.DynamicEntity.loadDocumentBody("annotation", noteid.id, function (base64str) {
                if (imgElement)
                {
                    if (base64str != "undefined" || base64str != null || base64str != "") {
                        imgElement.setAttribute("src", "data:image/jpeg;base64," + base64str); // set the "src" attribute for out <img> element
                        document.getElementById("loader").style.display = "none";
                    }
                    else {
                        MobileCRM.bridge.alert("Image not available, kinldy sync again and try.");
                        document.getElementById("loader").style.display = "none";
                        document.getElementById("optionset").style.display = "block";
                        document.getElementById("tablelist").style.display = "block";
                        document.getElementById("loadImage").style.display = "none";
                        document.getElementById("btnClose").style.display = "none";
                        FS.btnclicked = false;
                    }
                }
            }, function (err) {
                    if (err == "Not found") {
                        MobileCRM.bridge.alert("File is not an image or does not exist. If a video, please open Safety Flash to view.");
                        ocument.getElementById("loader").style.display = "none";
                        document.getElementById("optionset").style.display = "block";
                        document.getElementById("tablelist").style.display = "block";
                        document.getElementById("loadImage").style.display = "none";
                        document.getElementById("btnClose").style.display = "none";
                        FS.btnclicked = false;
                    }
                    else {
                        MobileCRM.bridge.alert("error");
                        document.getElementById("loader").style.display = "none";
                    }
            }, null);
            FS.btnclicked = true;
        }
        else {
            document.getElementById("optionset").style.display = "block";
            document.getElementById("rflist").style.display = "block";
            document.getElementById("loadImage").style.display = "none";
            document.getElementById("btnClose").style.display = "none";
            FS.btnclicked = false;
        }
    },
    buildTable: function (itemArray) {
        var sortedArraybyDate = itemArray;
        sortedArraybyDate = sortedArraybyDate.sort(function (a, b) {

            a = new Date(a.Date);
            b = new Date(b.Date);
            var returnvalue = a > b ? -1 : a < b ? 1 : 0;
            return returnvalue;
        })

        var table = document.getElementById("tablelist");
        table.tBodies[0].innerHTML = "";
        var tableRows = "";
        var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        //if (FS.IsOnLine) {
        //    tableRows = tableRows +
        //        "<tr><td colspan='3'>YOU ARE ONLINE ONLINE ONLINE</td></td>";
        //}
        //else {
        //    tableRows = tableRows +
        //        "<tr><td colspan='3'>YOU ARE OFFLINE</td></td>";
        //}


        for (var i in sortedArraybyDate) {
            var currentRecord = sortedArraybyDate[i];
            //Create the Day and Time
            var adjustHours = currentRecord.Date.getHours() > 12 ? currentRecord.Date.getHours() - 12 : currentRecord.Date.getHours();
            var displayTime = [[adjustHours,
                FS.MyNotif.addZero(currentRecord.Date.getMinutes())].join(":")];
            var addon = "AM";
            addon = currentRecord.Date.getHours() >= 12 ? "PM" : "AM";
            displayTime = displayTime + addon;
            var StatusText = currentRecord.Status == 929530000 ? "From " : "Holding: From ";
            if (currentRecord.Status == null) {
                StatusText = "From ";
            }
            var titleclass = "irocTitle";
            var notificationclass = "irocNotificationMonth"
            if (currentRecord.Expired) { titleclass = "irocTitle"; } else { titleclass = "irocTitleRed"; }
            if (currentRecord.Expired) { notificationclass = "irocNotificationMonth"; } else { notificationclass = "irocNotificationMonthRed"; }

            let obj = FS.Categories.find(obj => obj.id == currentRecord.Category);
            //Photo
            var showIcon = "hidden";
            if (currentRecord.Photo) {
                showIcon = "visible";
            }
            //                "<td class='irocBody'>" + currentRecord.CompletedBy + " @ " + displayTime + " " + addon + "</td>" +
            var line2 = StatusText + currentRecord.CompletedBy + " @ " + displayTime;
            tableRows = tableRows +
                //Row 1, 3 columns
                "<tr>" +
                "<td rowspan='3' class='" + notificationclass + "' onclick='FS.MyNotif.onClickOpen(this)' id='" + currentRecord.LinkId + "'>" + months[currentRecord.Date.getMonth()] + "<br/>" + FS.MyNotif.addZero(currentRecord.Date.getDate()) + "</td>" +
                "<td class='" + titleclass + "' onclick='FS.MyNotif.onClickOpen(this)' id='" + currentRecord.LinkId + "'>" + obj.name.toUpperCase() + ": " + currentRecord.Title + "</td>" +
                "<td rowspan='3' class='irocIcon irocIconBottom'><img id=" + currentRecord.AnnotationId + " style='height: 25px; visibility: " + showIcon + "' src='paperclip.svg' onclick='FS.MyNotif.loadAttachment(this)'></td>" +
                "</tr>" +
                //Row 2
                "<tr>" +
                "<td class='irocBody'  onclick='FS.MyNotif.onClickOpen(this)' id='" + currentRecord.LinkId + "'>" + line2 + "</td>" +

                "</tr>" +
                //Row 3
                "<tr>" +
                "<td class='irocBody irocTableLastRow' onclick='FS.MyNotif.onClickOpen(this)' id='" + currentRecord.LinkId + "'>" + currentRecord.Body + "</td>" +
                "</tr>";
        }
        table.tBodies[0].innerHTML += tableRows;

        document.getElementById("loader").style.display = "none";
        if (itemArray.length == 0) {
            $("#noRecords").show();
        }
        else {
            $("#noRecords").hide();
        }
        var numberRecords = "# of Safety Flashes: " + itemArray.length.toString();
        $('.counter').html(numberRecords);
    },

    addZero: function (num) {
        return (num >= 0 && num < 10) ? "0" + num : num + "";
    },

    onClickOpen: function (e) {
        var dataitem = e.id;
        MobileCRM.UI.FormManager.showDetailDialog("iroc_safetynotification", dataitem, null);
    },
    SortByLabel: function (a, b) {
        var aName = a.label.toLowerCase();
        var bName = b.label.toLowerCase();
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    },
    getCategorys: function () {
        FS.Categories = [];
        MobileCRM.Metadata.getOptionSetValues(
            "iroc_safetynotification",
            "iroc_category",
            function (optionSetValues) {

                // MobileCRM.bridge.alert("iroc_category");
                for (name in optionSetValues) {

                    var val = optionSetValues[name];

                    var newItem = new Object();
                    newItem.id = val;
                    newItem.name = name;
                    FS.Categories.push(newItem);

                }
                //Now that we have the Foreman groups, we get all SFs
                FS.MyNotif.getForeman();
            },
            function (error) { MobileCRM.bridge.alert("did not find optionset iroc_category"); },
            null
        );
    },
    getForeman: function () {
        FS.AllForemanGroups = [];
        MobileCRM.Metadata.getOptionSetValues(
            "account",
            "iroc_foremangroup",
            function (optionSetValues) {
                var foremanListGroup = document.getElementById('foremangroupfilter');
                var i = 0;
                var optNumber = 0;
                var options = [];
                var newItem = new Object();
                newItem.ForemanID = -1;
                newItem.ForemanName = "Mine";
                FS.AllForemanGroups.push(newItem);

                foremanListGroup.options[optNumber] = new Option("Mine", -1);
                foremanListGroup.options[optNumber].selected = true;

                newItem.ForemanID = -2;
                newItem.ForemanName = "All Field";
                FS.AllForemanGroups.push(newItem);
                optNumber++;
                foremanListGroup.options[optNumber] = new Option("All Field", -2);

                // MobileCRM.bridge.alert("iroc_foremangroup");
                for (name in optionSetValues) {

                    var val = optionSetValues[name];

                    var newItem = new Object();
                    newItem.ForemanID = val;
                    newItem.ForemanName = name;
                    FS.AllForemanGroups.push(newItem);

                    optNumber++;
                    foremanListGroup.options[optNumber] = new Option(name, val);


                }
                //Now that we have the Foreman groups, we get all SFs
                FS.MyNotif.getAllMyNotifs();
            },
            function (error) { MobileCRM.bridge.alert("did not find optionset"); },
            null
        );





    },
    getAllMyNotifs: function () {
        var fetchData = {
            iroc_userid: FS.CurrentUser
        };
        var fetchXml = [
            "<fetch resultformat='DynamicEntities' version='1.0' aggregate='false' disctinct='true'>",
            "  <entity name='iroc_notificationsend'>",
            "    <attribute name='iroc_foremangroup' />",
            "    <attribute name='iroc_userid' />",
            "    <attribute name='iroc_notificationtype' />",
            "    <attribute name='iroc_notificationcontent' />",
            "    <attribute name='iroc_notificationsentdate' />",
            "    <attribute name='iroc_safetynotificationid' />",
            "    <attribute name='createdon' />",
            "    <attribute name='iroc_sendnotice' />",
            "    <link-entity name='iroc_safetynotification' from='iroc_safetynotificationid' to='iroc_safetynotificationid' link-type='inner' alias='sn'>",
            "      <attribute name='iroc_category' />",
            "      <attribute name='iroc_title' />",
            "      <attribute name='iroc_expiresondate' />",
            "      <attribute name='iroc_safetynotifcationstatus' />",
            "      <attribute name='createdby' />",
            "           <link-entity name='annotation' from='objectid' to='iroc_safetynotificationid' link-type='outer' alias='note'>",
            "        <attribute name='isdocument' />",
            "        <attribute name='annotationid' />",
            "      </link-entity>",
            "    </link-entity>",
            "    <filter type='and'>",
            "      <condition attribute='iroc_userid' operator='eq' value='", fetchData.iroc_userid/*0c4fbca6-66c0-4348-8d44-ae92eaa8ee5b*/, "'/>",
            "    </filter>",
            "  </entity>",
            "</fetch>",
        ].join("");
        FS.TableItemList = [];
        MobileCRM.FetchXml.Fetch.executeFromXML(
            fetchXml, function (MyNotifRecords) {
                for (var i in MyNotifRecords) {
                    var thisRecord = MyNotifRecords[i].properties;
                    //Create Array List of Objects
                    var newItem = new Object();
                    newItem.Type = "user";
                    newItem.LinkId = thisRecord["iroc_safetynotificationid"].id;
                    newItem.Title = thisRecord["sn.iroc_title"] == undefined ? "" : thisRecord["sn.iroc_title"];
                    newItem.Body = thisRecord["iroc_notificationcontent"] == undefined ? "" : thisRecord["iroc_notificationcontent"];
                    newItem.Date = thisRecord["createdon"];
                    newItem.ForemanGroup = -1;
                    newItem.Category = thisRecord["sn.iroc_category"] == undefined ? "" : thisRecord["sn.iroc_category"];
                    newItem.Status = thisRecord["iroc_sendnotice"] == undefined ? 0 : thisRecord["iroc_sendnotice"];
                    var expired = thisRecord["sn.iroc_safetynotifcationstatus"] == undefined ? "929530001" : thisRecord["sn.iroc_safetynotifcationstatus"].toString();
                    if (expired == "929530001") {
                        newItem.Expired = true;
                    }
                    else {
                        newItem.Expired = false;
                    }
                    newItem.Photo = thisRecord["note.isdocument"] == undefined || thisRecord["note.isdocument"] == null ? false : thisRecord["note.isdocument"];
                    newItem.CompletedBy = thisRecord["sn.createdby"] === undefined ? null : thisRecord["sn.createdby"].primaryName;
                    newItem.AnnotationId = thisRecord["note.annotationid"] === undefined ? null : thisRecord["note.annotationid"];
                    FS.TableItemList.push(newItem);
                }

                //Now get all Safety Notifications so we can filter by Foreman group.
                var fetchXml1 = [
                    "<fetch resultformat='DynamicEntities' version='1.0' aggregate='false' distinct='true'>",
                    "  <entity name='iroc_notificationsend'>",
                    "    <attribute name='iroc_notificationtype' />",
                    "    <attribute name='iroc_notificationcontent' />",
                    "    <attribute name='iroc_safetynotificationid' />",
                    "    <attribute name='iroc_foremangroup' />",
                    "    <link-entity name='iroc_safetynotification' from='iroc_safetynotificationid' to='iroc_safetynotificationid' link-type='inner' alias='sn'>",
                    "      <attribute name='iroc_category' />",
                    "      <attribute name='iroc_title' />",
                    "      <attribute name='createdon' />",
                    "      <attribute name='iroc_safetynotificationid' />",
                    "      <attribute name='iroc_safetynotifcationstatus' />",
                    "      <attribute name='iroc_expiresondate' />",
                    "      <attribute name='createdby' />",
                    "           <link-entity name='annotation' from='objectid' to='iroc_safetynotificationid' link-type='outer' alias='note'>",
                    "        <attribute name='isdocument' />",
                    "        <attribute name='annotationid' />",
                    "      </link-entity>",
                    "    </link-entity>",
                    "  </entity>",
                    "</fetch>",
                ].join("");
                MobileCRM.FetchXml.Fetch.executeFromXML(
                    fetchXml1, function (MyNotifRecords) {
                        for (var i in MyNotifRecords) {
                            var thisRecord = MyNotifRecords[i].properties;
                            //Create Array List of Objects
                            var newItem = new Object();
                            newItem.Type = "foreman";
                            newItem.LinkId = thisRecord["sn.iroc_safetynotificationid"];
                            newItem.Title = thisRecord["sn.iroc_title"] == undefined ? "" : thisRecord["sn.iroc_title"];
                            newItem.Body = thisRecord["iroc_notificationcontent"] == undefined ? "" : thisRecord["iroc_notificationcontent"];
                            newItem.Date = thisRecord["sn.createdon"];
                            newItem.Category = thisRecord["sn.iroc_category"] == undefined ? "" : thisRecord["sn.iroc_category"];
                            newItem.Status = null;
                            newItem.ForemanGroup = thisRecord["iroc_foremangroup"] == undefined ? 0 : thisRecord["iroc_foremangroup"];
                            var expired = thisRecord["sn.iroc_safetynotifcationstatus"] == undefined ? "929530001" : thisRecord["sn.iroc_safetynotifcationstatus"].toString();
                            if (expired == "929530001") {
                                newItem.Expired = true;
                            }
                            else {
                                newItem.Expired = false;
                            }
                            newItem.Photo = thisRecord["note.isdocument"] == undefined || thisRecord["note.isdocument"] == null ? false : thisRecord["note.isdocument"];
                            newItem.CompletedBy = thisRecord["sn.createdby"] === undefined ? null : thisRecord["sn.createdby"].primaryName;
                            newItem.AnnotationId = thisRecord["note.annotationid"] === undefined ? null : thisRecord["note.annotationid"];
                            FS.TableItemList.push(newItem);
                        }
                        FS.MyNotif.applyFilters();

                    }, function (error) {
                        document.getElementById("loader").style.display = "none";
                        MobileCRM.bridge.alert("Get SN Error: " + error);
                    }, null);
            }, function (error) {
                document.getElementById("loader").style.display = "none";
                MobileCRM.bridge.alert("Get SN Error: " + error);
            }, null);
    },
    applyFilters() {

        //Filter to Expired/current Toggle
        var tempInitial = FS.TableItemList;


        //tempInitial = $.grep(FS.TableItemList, function (n, i) {
        //    return (n.Expired == FS.SelectedToggle
        //    );
        //}, false);


        //Filter the Array to just the selected foreman groups
        var tempForemanArray = tempInitial;
        if (FS.SelectedForemanGroups.toString() != "-1" && FS.SelectedForemanGroups.toString() != "-2") {
            tempForemanArray = jQuery.grep(tempInitial, function (n, i) {
                if (n.Type == "foreman" && n.ForemanGroup != null && (n.ForemanGroup.toString() === FS.SelectedForemanGroups.toString())) {
                    return true;
                }
                return false;

            });
        }
        if (FS.SelectedForemanGroups.toString() == "-1") {
            tempForemanArray = jQuery.grep(tempInitial, function (n, i) {
                if (n.Type == "user") {
                    return true;
                }
                return false;

            });
        }
        if (FS.SelectedForemanGroups.toString() == "-2") {
            tempForemanArray = jQuery.grep(tempInitial, function (n, i) {
                if (n.Type == "foreman") {
                    return true;
                }
                return false;

            });
        }
        const seen = new Set();
        var buildTableArry = tempForemanArray.filter(el => {
            const duplicate = seen.has(el.LinkId);
            seen.add(el.LinkId);
            return !duplicate;
        });
        FS.MyNotif.buildTable(buildTableArry);
    },
    onchange: function () {
        var e = document.getElementById("foremangroupfilter");
        var value = e.options[e.selectedIndex].value;
        FS.SelectedForemanGroups = value.toString();
        FS.MyNotif.applyFilters();
    },
    toggleFilterButtonNotCompleted: function () {

        $("#buttoncomplete").show();
        $("#buttonnotcompleted").hide();
        FS.SelectedToggle = false;
        FS.MyNotif.applyFilters();
    },
    toggleFilterButtonComplete: function () {
        $("#buttoncomplete").hide();
        $("#buttonnotcompleted").show();
        FS.SelectedToggle = true;
        FS.MyNotif.applyFilters();
    },
    createNewSF: function () {
        MobileCRM.UI.FormManager.showNewDialog(
            "iroc_safetynotification",
            null,
            null,
            null
        );
    }
};
