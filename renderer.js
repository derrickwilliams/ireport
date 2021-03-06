'use strict';

const electron = require('electron');
const {remote} = electron;
const mainProcess = remote.require('./index');

var Violation = require('./models/violation.js');

let selectedFile = '';
let fileInfoList = new Array();

/*
  Store information about the current sorting at any moment

  E.g. If sortedBy.lineNumber is `true`, that means the list has already been sorted
    by line number in ascending order. Hence if user clicks on lineNumber header again,
    we will sort the list in descending order and set sortedBy.lineNumber `false`.
    Now if, user clicks on the lineNumber header again, then the list will be sorted
    in ascending order again.
*/
let sortedBy = {
  className: false,
  lineNumber: false,
  description: false
};

/*
  Initialises the file Info list based on JSON Data parsed from the file read from the
  local system. This file instance is then saved for global access.
*/
const initFileInfoFromData = (data) => {
  let jsonData = JSON.parse(data);
  fileInfoList = jsonData.pmd.file;
}

/*
  Displays the violations list passed to it on the view. This method abstracts out any business logic
  associated with the violations. This helps us in modifications of the list outside this method, like
  sorting data etc.
*/
const showViolationsTable = (violationsList) => {
  let violationsTable = getViolationsTable(violationsList);
  document.getElementById('error-message-container').innerHTML = violationsTable;
  addAllSortingListeners();
}

/*
  Gets triggered once the DOM is ready and all resources have been loaded. Calls `openLastFile`
  from the exported functions and loads the content (JSON) returned in the callback.
*/
window.onload = _ => {
  mainProcess.openLastFile((data) => {
    initFileInfoFromData(data);
    let violationsList = getAllViolations();
    showViolationsTable(violationsList);
  });
}

/*
  Calls `chooseFile` first, and then calls `parseFile` from the exported functions to load
  the content (JSON) returned in the callback.
*/
document.getElementById('chooseFile').addEventListener('click', _ => {
  mainProcess.chooseFile((fileName) => {
    selectedFile = fileName;
    if (selectedFile) {
      mainProcess.parseFile(selectedFile[0], (data) => {
        initFileInfoFromData(data);
        let violationsList = getAllViolations();
        showViolationsTable(violationsList);
      }); 
    }
  });
});

/*
  Adds all click listeners that sort the violations based on a certain property like
  class name, line number or description/error message.
*/
const addAllSortingListeners = _ => {
  /*
    Click on ClassName will sort the list in Ascending order by class name and display.
  */
  document.getElementById('className').addEventListener('click', _ => {
    clearViolationsTable();
    let violationsList = getAllViolations();

    /*
      If sortedBy.className is `true`, that means we need to sort the list in descending order now.
      Otherwise, sort the list in ascending order.
    */
    let factor = sortedBy.className ? -1 : 1;

    violationsList.sort(function(a,b) {
      return b.className.localeCompare(a.className) * factor;
    });
    

    /*
      Toggle the flag sortedBy.className to make sure the list is sorted in opposite order next time.
    */
    sortedBy.className = !sortedBy.className;

    showViolationsTable(violationsList);
  });
  
  /*
    Click on LineNumber will sort the list in Ascending order by Line Number and display.
  */
  document.getElementById('lineNumber').addEventListener('click', _ => {
    clearViolationsTable();
    let violationsList = getAllViolations();

    /*
      If sortedBy.lineNumber is `true`, that means we need to sort the list in descending order now.
      Otherwise, sort the list in ascending order.
    */
    let factor = sortedBy.lineNumber ? -1 : 1;

    violationsList.sort(function(a,b) {
      return (b.beginningLine - a.beginningLine) * factor;
    });

    /*
      Toggle the flag sortedBy.lineNumber to make sure the list is sorted in opposite order next time.
    */
    sortedBy.lineNumber = !sortedBy.lineNumber;

    showViolationsTable(violationsList);
  });

  /*
    Click on Error Message will sort the list in Ascending order by description and display.
  */
  document.getElementById('description').addEventListener('click', _ => {
    clearViolationsTable();
    let violationsList = getAllViolations();

    /*
      If sortedBy.description is `true`, that means we need to sort the list in descending order now.
      Otherwise, sort the list in ascending order.
    */

    let factor = sortedBy.description ? -1 : 1;

    violationsList.sort(function(a,b) {
      return b.description.localeCompare(a.description) * factor;
    });

    /*
      Toggle the flag sortedBy.description to make sure the list is sorted in opposite order next time.
    */
    sortedBy.description = !sortedBy.description;
    showViolationsTable(violationsList);
  });

}

/*
  Removes the Violations Table from the Page.
*/
const clearViolationsTable = _ => {

  document.getElementById('error-message-container').innerHTML = '';

}

/**
* This method returns an Array of Violations.
*/
const getAllViolations = _ => {

  let violationsList = new Array();

  for (let fi in fileInfoList) {

      let fileName = fileInfoList[fi].$.name;
      let errorsInFile = fileInfoList[fi].violation;
      for (let i=0; i<errorsInFile.length;i++) {
        let error = errorsInFile[i];
        let violation = new Violation(fileName, error.$.class, error.$.beginline, error._);
        violationsList.push(violation);
      } 

  }

  return violationsList;
}

/*
  This method returns the completely built Violations Table from the Violations List
  passed to it. This method has been abstracted out in order to keep the view logic 
  separate.
*/
const getViolationsTable = (violationsList) => {
    let html = '';
    html += '<div id="error-message"><h5>Violations</h5>';
    html += '<table class="striped"><tr><th id="className">Class name</th><th id="lineNumber">Line number</th><th id="description">Error message</th></tr>';
    
    for (let i=0;i<violationsList.length;i++) {
      let violation = violationsList[i];
      html += '<tr>';
      html += '<td class="error-class">' + violation.className + '</td>';
      html += '<td class="error-beginline">' + violation.beginningLine + '</td>';
      html += '<td class="error-desc">' + violation.description + '</td>';
      html += '</tr>';
    }

    html += '</table>';
    html += '</div>';
    return html;
}
