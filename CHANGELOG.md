# Changelog

## [0.5.0]

### ✨ Features

- Added support for filtering reports by client via `{INCLUDE|EXCLUDE} CLIENTS "Client A"[, "Client B", ...]`

## [0.4.1] 

### 🐛 Fixes

- Fixed time entries without a project showing project 'null' in Toggl reports (now listed under '(No project)').
- Fixed duplicated time entries from the Toggl API response inflating total times in reports.
- Fixed summary report bar chart tooltips from saying "week" instead of the month's name.

## [0.4.0]

This is the biggest update so far! This update enables you to visualize your Toggl time entry data right inside your Obsidian notes.

To learn how, check out the [getting started](https://github.com/mcndt/obsidian-toggl-integration/wiki/Creating-Toggl-reports-inside-notes) page!

### ✨ Features

- You can now generate Toggl reports inside notes using code blocks with the language '`toggl`'
- Generate summary reports
- Generate list reports

### 🐛 Fixes

- (Probably) fixed [a bug](https://github.com/mcndt/obsidian-toggl-integration/issues/34) where the sidebar periodically clears due to failing API requests.

## [0.3.0]

### ✨ Features

- Sidebar view now shows tags on active time entry.
- You can now add tags to a new time entry when entering the description.
- Adding tags to a time entry uses autocompletion using the Toggl workspace's existing tags.

### ⚙️ Internal

- Plugin now immediately refreshes current timer status when starting/stopping a time entry and on plugin load.

## [0.2.5]

### HOTFIX

- Reduced the active timer polling rate to once every 6 seconds by request by from the Toggl Track API team.

## [0.2.4]

### HOTFIX

Toggl started responding with error status 418 on all requests with the default user-agent of the npm got package, so I set a custom user agent to identify calls made by this plugin.

Hopefully this won't happen again!

## [0.2.3]

### 🐛 Fixes

- Fix tags not being added on repeat time entries when starting a new time entry (thanks @AetheresMMI for the bug report!).

## [0.2.2]

### 🐛 Fixes

- Fix stop timer command actually opening the start timer modal (thanks @ljantzen for the bug report!)

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