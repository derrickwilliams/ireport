/*
* @Author: sahildua2305
* @Date:   2016-07-23 23:17:53
* @Last Modified by:   Ishan Khanna
* @Last Modified time: 2016-07-24 17:01:00
*/

'use strict';

//console.log('renderer');

const electron = require('electron');
const remote = electron.remote;
const mainProcess = remote.require('./index');

var selectedFile = '';

document.getElementById('chooseFile').addEventListener('click', _ => {
  mainProcess.chooseFile(function (fileName) {
    console.log(fileName);
    selectedFile = fileName;
  });
});
/**
* A Violation class holds all the information about each error and/or warning generated by the Quality Check Plugin. 
*/
function Violation(fileName, className, beginningLine, description) {
  this.fileName = fileName;
  this.className = className;
  this.beginningLine = beginningLine;
  this.description = description;
}

document.getElementById('parseFile').addEventListener('click', _ => {
  if (selectedFile) {
    mainProcess.parseFile(selectedFile, function (data) {
      var json_data = JSON.parse(data);
      var files_info = json_data.pmd.file;
      var violationsList = getAllViolations(files_info);
      var violationsTable = getViolationsTable(violationsList);
      document.getElementById('error-message-container').innerHTML = violationsTable;
    }); 
  } else {
    alert("No file selected");
  }
});

/**
* This method returns an Array of Violations.
*/
function getAllViolations(fileInfoList) {

  var violationsList = new Array();

  for (var fi in fileInfoList) {

      var fileName = fileInfoList[fi].$.name;
      var errorsInFile = fileInfoList[fi].violation;
      for (var e in errorsInFile) {
        var error = fileInfoList[e].violation[0];
        var violation = new Violation(fileName, error.$.class, error.$.beginline, error._);
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
function getViolationsTable(violationsList) {
    var html = '';
    for (var i=0;i<violationsList.length;i++) {
      var violation = violationsList[i];
      html += '<div id="error-message">';
      html += '<h5>' + violation.fileName + '</h5>';
      html += '<table border="1" cellspacing="0" cellpadding="0"><tr><th>ClassName</th><th>Line Number</th><th>Error Message</th></tr>';
      html += '<tr>';
      html += '<td class="error-class">' + violation.className + '</td>';
      html += '<td class="error-beginline">' + violation.beginningLine + '</td>';
      html += '<td class="error-desc">' + violation.description + '</td>';
      html += '</tr>';
      html += '</table>';
      html += '</div>';
    }
    return html;
}
