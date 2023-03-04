# Creating Toggl reports inside notes

With update 0.4.0 of the Toggl Track integration for Obsidian you can view Toggl time entry data right inside your Obisian notes.

Here are some examples of use cases:

- Showing a list of time entries for that day in your daily notes
- Showing a visualization of time spent during a month in a monthly review note
- Tracking time spent on a school or work project in that project's note
- ...

As you will see, it is extremely quick to set up and modify reports. Let's get started!

## Getting started

Let's start with a simply query first. Let's generate an overview of how we spent our time this week. We can do that with the following query:

````
```toggl
SUMMARY WEEK
```
````

This will result in something like this:

![example-getting-started](https://user-images.githubusercontent.com/23149353/148294480-b2893e21-0fa9-421c-96f2-9b74c7ba65e8.png)

Pretty neat! With just a two-word command, you can generate a highly informative overview right from Obsidian. I highly encourage you to try this yourself in your Obsidian client.

## More examples

Here are some more use cases and examples of queries. Feel free to copy and paste these in your own Obsidian client to try for yourself.

**Monthly review**

This query will generate a summary report for December 2021. The list of projects will be orderd in decreasing total spent time.

````
```toggl
SUMMARY FROM 2021-12-01 TO 2021-12-31
SORT DESC
```
````

**Today's entries**

This query will generate a list of time entries logged today, grouped by project and ordered in decreasing total spent time per project.

````
```toggl
LIST TODAY
GROUP BY PROJECT
SORT DESC
```
````

**Tracking time spent on a school course**

This query will generate a summary report of time spent during the fall semester of 2021 on the "CS 101 Coursework" and "CS 101 Finals Prep" projects in your workspace.

````
```toggl
SUMMARY
FROM 2021-08-13 TO 2021-12-18
INCLUDE PROJECTS "CS 101 Coursework", "CS 101 Finals Prep"
TITLE "CS 101"
```
````
