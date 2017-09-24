# JIRA Buddy
A convenience helper for your most common or day-to-day OnDemand JIRA tasks.

[Download](https://chrome.google.com/webstore/detail/jira-buddy/nbojmnaggjklggjfddmlognhlchhgblp) it on the Chrome Webstore<br>
[Submit bugs and issues](https://github.com/demoive/JIRA-Buddy/issues) on GitHub<br>
[View the project board](https://trello.com/board/jira-buddy/512dfc830265343a150027ad) on Trello

![Screenshot of the Chrome Extension Popup](https://demoive.github.io/JIRA-Buddy/chrome-store-screenshot.png)

## Features
- Quick "go-to" search box: will either open a new or the existing tab for the JIRA issue submitted
- All of your favorite filters from JIRA are automatically available by default
- Switch between any filter to instantly see the results
- Show the result count of any [JQL](https://confluence.atlassian.com/display/JIRA/Advanced+Searching) filter on the extension badge. Lots of [samples](https://confluence.atlassian.com/display/JIRACOM/Example+SQL+queries+for+JIRA) available
- Inovative **Ownership** column with the most concise way to show the _reporter_ and current _assignee_ of an issue
- Easily switch the project context in case your JIRA instance has more than one projects

<!-- Recieve notification for all issues matched to any filter -->

## Philosophy
For third party, unofficial apps (as is the case with this and all the other JIRA extensions), I appreciate having a philosophy of being as unintrunsive as possible. With regards to security concerns, if they are at all avoidable, even better!

That is why with this extension, you do not need to input nor save any credentials or data. The extension uses the active session of your browser - if you are not logged in to your OnDemand instance in the browser, the extension won't do much! This saves you the trouble of trusting the security concerns of a third party developer (me) since no sensitive data is ever stored.

It quite literally is a convinience tool to facilitate certain tasks.

<!--
## Customization vs. configuration vs. neither
I used to "customize" the [Announcement Banner](https://confluence.atlassian.com/display/JIRA/Configuring+an+Announcement+Banner) of JIRA back when HTML was allowed within this field. In my opinion, I was able to display the information in a much nicer way:

// IMAGE SAMPLE

We also took advantage of being able to embed `<script>` tags within field descriptions to tweak all sort of JIRA functionality. Occasionally, we caused Javascript conflicts

was [allowed in certain fields](https://confluence.atlassian.com/display/JIRA/Fields+Allowing+Custom+HTML+or+JavaScript).
There are many more


https://jira.atlassian.com/browse/JRA-28349

https://developer.atlassian.com/display/JIRADEV/Preparing+for+JIRA+5.1#PreparingforJIRA5.1-CustomFieldsthatuseCSSorJavaScriptWebResources

Original idea for default description content
https://jira.atlassian.com/browse/JRA-4812

https://jira.atlassian.com/browse/JRA-28776
-->
