# PWA Controls
This is a simple Macro which gives you the ablity to easily toggle between Persistent Web App and Controller modes on your Webex Navigator. It also lets you change the Persistent Web App URL from a list which can be configured in the Macro.

![output_RMSTUx(1)](https://user-images.githubusercontent.com/21026209/166060186-c4f0d8ca-22c4-4598-977f-78dd47ab049e.gif)

## Exit PWA Mode

### Using the Macro UI Panel
If you have a Touch 10 or another Webex Room Navigator paired with your Webex Device in controller mode. The Macros UI panel will always be accessible even when PWA is configured on one of the paired Navigators. The same goes for Webex Device which as has a touch interface on its main display, the Macro UI will be accessible and this allows you to switch the Navigator in PWA mode back to controller mode.

### Using a Cloud xAPI command
You can also use Cloud xAPI commands to exit PWA mode from your Kiosk web app. The Macro listens for the keyword 'ExitPWA' which can be sent to the device using Message Send xAPI. This will require your Web App or its backend to use an access token. More information on this Cloud xAPI command can be found here: https://roomos.cisco.com/xapi/Command.Message.Send/

## Requirements

1. RoomOS 10.12.x or above Webex Device with a Webex Room Navigator Paired ( over a LAN connection and powered via POE, not connected directly to the main Webex Device )
2. Web admin access to the device to uplaod the macro.
3. Bot or admin access token if you wish to use Cloud xAPI to switch the Navigator back to Controller mode from a displayed Web App.
4. A seperate Controller (either Touch 10 or Navigator in Controller) if your Webex Device doesn't have a touch interface so that you can toggle between PWA and Controller modes.


## Setup

1. Download the ``pwa-controls.js`` file and upload it to your Webex Room devices Macro editor via the web interface.
2. Configure the Macro by changing the initial values, there are comments explaining each one.
3. Enable the Macro on the editor.


## Validation
This Macro was developed and tested on a Webex Codec Pro with Webex Room Navigator and a Touch 10 to verify the exist PWA mode feature. Other combinations of devices e.g. Desk/Board devices paired with a Navigator should also work but haven't been tested at this time.

## Support

Please reach out to the WXSD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=layout-macro).
