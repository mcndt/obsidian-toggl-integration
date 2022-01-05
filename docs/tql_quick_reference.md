# TQL Quick Reference

To create a Toggl report query, create a codeblock with the `toggl` language:

~~~
```toggl
// your query here
```
~~~

Queries must always have a report type and a time range. Query expressions must always following the following order:

1. Report type
2. Time range
3. (Optional) project filter
4. (Optional) group by and/or sort
5. (Optional) custom appearance

**Report types:**

- `LIST`
- `SUMMARY`

**Time ranges:**

- `TODAY` 
- `WEEK` (this week)
- `MONTH` (this month)
- `PAST {int} {DAYS|WEEKS|MONTHS)`
- `FROM {YYYY-MM-DD} TO {YYYY-MM-DD|TODAY}`

**Project filter:**

- `{INCLUDE|EXCLUDE} PROJECTS "project 1" [, "project 2", ...]`

Project names must be encapsulated by double quotes. Project IDs from the Toggl API can also be used (without double quotes).

**Group by:**

- `GROUP BY {DATE|PROJECT}`

**Sorting:**

- `SORT {ASC|DESC}`

**Customization:**

- `TITLE "custom title"`