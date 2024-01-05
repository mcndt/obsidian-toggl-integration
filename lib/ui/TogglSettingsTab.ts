import { DEFAULT_SETTINGS } from "lib/config/DefaultSettings";
import type MyPlugin from "main";
import {
  App,
  ButtonComponent,
  DropdownComponent,
  ExtraButtonComponent,
  PluginSettingTab,
  Setting,
} from "obsidian";

import type { TogglWorkspace } from "../model/TogglWorkspace";

export default class TogglSettingsTab extends PluginSettingTab {
  private plugin: MyPlugin;
  private workspaceDropdown: DropdownComponent;
  private workspaces: TogglWorkspace[];

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl("h2", {
      text: "Toggl Track integration for Obsidian",
    });

    this.addApiTokenSetting(containerEl);
    this.addTestConnectionSetting(containerEl);
    this.addWorkspaceSetting(containerEl);
    this.addUpdateRealTimeSetting(containerEl);

    containerEl.createEl("h2", {
      text: "Status bar display options",
    });
    this.addCharLimitStatusBarSetting(containerEl);
    this.addStatusBarFormatSetting(containerEl);
    this.addStatusBarPrefixSetting(containerEl);
    this.addStatusBarProjectSetting(containerEl);
    this.addStatusBarNoEntrySetting(containerEl);
  }

  private addApiTokenSetting(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("API Token")
      .setDesc(
        "Enter your Toggl Track API token to use this plugin. " +
          "You can find yours at the bottom of https://track.toggl.com/profile.",
      )
      .addText((text) =>
        text
          .setPlaceholder("Your API token")
          .setValue(this.plugin.settings.apiToken || "")
          .onChange(async (value) => {
            this.plugin.settings.apiToken = value;
            this.plugin.toggl.setToken(value);
            await this.plugin.saveSettings();
          }),
      );
  }

  private addTestConnectionSetting(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("Test API connection")
      .setDesc("Test your API token by connecting to Toggl Track.")
      .addButton((button: ButtonComponent) => {
        button.setButtonText("connect");
        button.onClick(() => this.testConnection(button));
        button.setCta();
      });
  }

  private addWorkspaceSetting(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("Toggl Workspace")
      .setDesc("Select your Toggl Workspace for fetching past timer entries.")
      .addExtraButton((button: ExtraButtonComponent) => {
        button.setIcon("reset").setTooltip("Fetch Workspaces");
        button.extraSettingsEl.addClass("extra-button");
        button.onClick(async () => {
          await this.fetchWorkspaces();
        });
      })
      .addDropdown(async (dropdown: DropdownComponent) => {
        // Register callback for saving new value
        dropdown.onChange(async (value: string) => {
          const workspace = this.workspaces.find((w) => w.id === value);
          this.plugin.settings.workspace = workspace;
          await this.plugin.saveSettings();
        });
        this.workspaceDropdown = dropdown;
        await this.fetchWorkspaces();
      });
  }

  private addUpdateRealTimeSetting(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("Real time daily total")
      .setDesc(
        "Update the daily total time in the sidebar " +
          "every second when a timer is running.",
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.updateInRealTime || false)
          .onChange(async (value) => {
            this.plugin.settings.updateInRealTime = value;
            await this.plugin.saveSettings();
          });
      });
  }

  private addCharLimitStatusBarSetting(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("Status bar character limit")
      .setDesc(
        "Set a character limit for the time entry " + 
        "displayed in the status bar."
      )
      .addText((text) => {
        text.setPlaceholder(String(DEFAULT_SETTINGS.charLimitStatusBar))
        text.inputEl.type = "number"
        text.setValue(String(this.plugin.settings.charLimitStatusBar))
        text.onChange(async (value) => {
          this.plugin.settings.charLimitStatusBar = (
            value !== "" ? Number(value) : DEFAULT_SETTINGS.charLimitStatusBar
          );
          await this.plugin.saveSettings();
        });
    });
  }

  private addStatusBarFormatSetting(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("Status bar time format")
      .setDesc(
        "Time format for the status bar. " +
          "See https://github.com/jsmreese/moment-duration-format for format options.",
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.statusBarFormat)
          .setValue(this.plugin.settings.statusBarFormat || "")
          .onChange(async (value) => {
            this.plugin.settings.statusBarFormat = value;
            await this.plugin.saveSettings();
          }),
      );
  }

  private addStatusBarPrefixSetting(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("Status bar prefix")
      .setDesc(
        "Prefix before the time entry in the status bar. " +
          "Leave blank for no prefix.",
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.statusBarPrefix)
          .setValue(this.plugin.settings.statusBarPrefix || "")
          .onChange(async (value) => {
            this.plugin.settings.statusBarPrefix = value;
            await this.plugin.saveSettings();
          }),
      );
  }

  private addStatusBarProjectSetting(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("Show project in status bar")
      .setDesc(
        "Show the project of the time entry displayed in the status bar."
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.statusBarShowProject || false)
          .onChange(async (value) => {
            this.plugin.settings.statusBarShowProject = value;
            await this.plugin.saveSettings();
          });
      });
  }

  private addStatusBarNoEntrySetting(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("No entry status bar message")
      .setDesc(
        "Message in the status bar when no time entry is running."
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.statusBarNoEntryMesssage)
          .setValue(this.plugin.settings.statusBarNoEntryMesssage || "")
          .onChange(async (value) => {
            this.plugin.settings.statusBarNoEntryMesssage = value;
            await this.plugin.saveSettings();
          }),
      );
  }

  private async fetchWorkspaces() {
    // empty the dropdown's list
    const selectEl = this.workspaceDropdown.selectEl;
    for (let i = selectEl.length - 1; i >= 0; i--) {
      this.workspaceDropdown.selectEl.remove(i);
    }

    // add the current setting to populate the field
    const currentWorkspace = this.plugin.settings.workspace;
    this.workspaceDropdown.addOption(
      currentWorkspace.id,
      currentWorkspace.name,
    );
    this.workspaceDropdown.setValue(currentWorkspace.id);

    // fetch the other workspaces from the Toggl API
    if (this.plugin.toggl.isApiAvailable) {
      this.workspaces = await this.plugin.toggl.getWorkspaces();
      this.workspaces = this.workspaces.filter(
        (w) => w.id != currentWorkspace.id,
      );
      for (const w of this.workspaces) {
        this.workspaceDropdown.addOption(w.id, w.name);
      }
    }
  }

  private async testConnection(button: ButtonComponent) {
    button.setDisabled(true);
    try {
      await this.plugin.toggl.testConnection();
      button.setButtonText("success!");
    } catch {
      button.setButtonText("test failed");
    } finally {
      button.setDisabled(false);
      window.setTimeout(() => {
        button.setButtonText("connect");
      }, 2500);
    }
  }
}
