# Changelog

## [0.2.1]

### 🐛 Fixes

- Fix summary sidebar panel showing `undefined` when running a time entry with no description.
- Fix project summary list not updating after stopping a timer

## [0.2.0]

Hello! This release features a basic implementation of the Toggl Track summary view for the sidebar.
Currently, this view can show you an overview of your day (total time + breakdown per project),
but in the future I will add more functionality to it (e.g. choose between day or week summary). 
Additonally, you can see your current time entry here as well as a button to start or stop time entries.

If you have any suggestions on how this sidebar panel can be improved for your workflow, please post in the Discussions tab on GitHub or tag me on the Obsidian Discord server! 

### ✨ Features

- Add summary of current time entry in side panel
- Add functionality to start or stop timers from the side panel (button triggers the respective commands)
- Add summary view of current day in side panel

### ⚙️ Internal

- Upgraded [toggl-client](https://github.com/saintedlama/toggl-client) dependency to commit `4a40a9d` of master branch to add the Toggl Reports API.

## [0.1.2] - 2021-08-08

### 🖊️ Admin

- Add license file

## [0.1.1] - 2021-08-08


### ✨ Features

- Add feature to view your current time entry in the toolbar
- Add command to start a new time entry (restart recent timer or choose project & description for new timer)
- Add command to stop a running time entry