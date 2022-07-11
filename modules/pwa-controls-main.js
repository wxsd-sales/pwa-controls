/********************************************************
Copyright (c) 2022 Cisco and/or its affiliates.
This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at
               https://developer.cisco.com/docs/licenses
All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*********************************************************
 * 
 * Macro Author:      	William Mills
 *                    	Technical Solutions Specialist 
 *                    	wimills@cisco.com
 *                    	Cisco Systems
 * 
 * Version: 1-0-0
 * Released: 07/27/22
 * 
 * This Webex Device Persistent Web App Control Macro allows you to toggle
 * between Controller and PWA mode on your paired Webex Room Navigators and 
 * change between different PWA URLs and from a UI Panel on either your main
 * Touch enabled interface or another Navigator/Touch 10 in controller mode.
 * When no other controller is available to access the UI  and toggle from 
 * PWA to Controller mode. The Macro listens for the keyword "ExitPWA" which
 * can be sent to it via Cloud xAPI from the Web App which is open on the
 * Navigator.
 * eg. https://www.example.com/?device=12345&token12345
 * 
 ********************************************************/

import xapi from 'xapi';
import { monitorMessage, peripheralsChange, syncUI, widgetEvent, createPanel} from './pwa-controls-utils'


/*********************************************************
 * Do not change below
**********************************************************/


// Our main function which initializes everything
async function main(){

  // Create our UI
  createPanel();

  // Sync the UI states
  await syncUI();

   // Listen for Widget and event changes
  xapi.Event.UserInterface.Extensions.Widget.Action.on(widgetEvent);
  xapi.Config.UserInterface.HomeScreen.Peripherals.WebApp.URL.on(syncUI);
  xapi.Event.Message.Send.on(monitorMessage);
  xapi.Status.Peripherals.ConnectedDevice.on(peripheralsChange);

}

// Run our main function and begin monitoring events
main();
