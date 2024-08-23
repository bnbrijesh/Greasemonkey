// ==UserScript==
// @name         Slack URL Setter and Notify on Shutdown
// @namespace    https://github.com/emnify/Greasemonkey
// @version      0.01
// @description  Prompt for Slack URL, store it, and notify Slack on specific Jenkins actions
// @author       Brijesh Kumat Bangalore
// @match        https://jenkins-test.oss-eks.dev.emnify.io/*
// @match        https://jenkins.oss-eks.14-iot-infra.net/*
// @match        https://jenkins.oss-eks.dev.emnify.io/*
// @match        https://jenkins.oss-eks.emnify.net/*
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.notification
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(async function() {
    'use strict';

    // Retrieve the stored Slack URL
    let slackUrl = await GM.getValue('slackUrl', null);

    // Function to prompt the user for the Slack URL
    async function promptForSlackUrl() {
        slackUrl = prompt('Please enter your Slack URL:', slackUrl || 'https://your-slack-url.slack.com');
        if (slackUrl) {
            await GM.setValue('slackUrl', slackUrl); // Store the Slack URL
            GM.notification({ title: 'Slack URL Set', text: 'Your Slack URL has been saved.', timeout: 3000 });
        }
    }

    // If the Slack URL is not set, prompt the user to enter it
    if (!slackUrl) {
        await promptForSlackUrl();
    } 
    
    console.log('Slack URL:', slackUrl);
    
    document.addEventListener('keydown', async function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'U') { // Ctrl+Shift+U to update the URL
            await promptForSlackUrl();
        }
    });
  
    // Function to send a message to Slack
    function sendToSlack(message, channel) {
        if (!slackUrl) {
            console.error('Slack URL is not set. Unable to send message.');
            return;
        }

        const payload = {
            text: message,
            username: "Jenkins Shut Down Bot",
            channel: channel,
            icon_emoji: "jenkins"
        };

        GM.xmlHttpRequest({
            method: 'POST',
            url: slackUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(payload),
            onload: function(response) {
                if (response.status === 200) {
                    console.log('Message sent to Slack successfully.');
                } else {
                    console.error('Failed to send message to Slack:', response.statusText);
                }
            },
            onerror: function(error) {
                console.error('Error sending message to Slack:', error);
            }
        });
    }

    // Function to handle button clicks
    function handleButtonClick(event) {
        const target = event.target;
        // Check if the clicked element is a button
        if (target.tagName === 'BUTTON') {
            console.log('Button target');
            // Get the button's name attribute and other relevant details
            const buttonName = target.getAttribute('name');
            const buttonText = target.textContent.trim();
            const buttonType = target.type;
            const buttonClass = target.className;
        
            // Log the button's name attribute and other details
            /*
            console.log('Button clicked by brijesh:', {
                buttonName: buttonName || 'No name attribute',
                buttonText: buttonText,
                buttonType: buttonType,
                buttonClass:buttonClass
            });
            */
            const domain = window.location.hostname; 
            let channel;
            if (domain.trim().includes('jenkins-test.oss-eks.dev.emnify.io')){
                channel = '#brijesh-jenkins-test';
                console.log("matched test");
            } else {
                channel = '#squad-pf';
            }
           
            if (buttonText.includes('Prepare for Shutdown')){
                console.log("Send message to Slack because 'Prepare for Shutdown' was clicked", domain);
                const slackMessage = "Preparing Shutdown of Jenkins " + domain;
                sendToSlack(slackMessage, channel);
            }
            if (buttonText.includes('Cancel Shutdown')){
                console.log("Send message to Slack because 'Cancel Shutdown' was clicked", domain);
                const slackMessage = "Removing Shutdown of Jenkins " + domain;
                sendToSlack(slackMessage, channel);
            }
        }
    }

    // Attach the event listener to the document
    document.addEventListener('click', handleButtonClick, true);
    
})();

