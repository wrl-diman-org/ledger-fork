import {
  CONTACT_ADDRESS_DATASET,
  CONTACTS_ETHEREUM_APP_VERSION,
  CONTACTS_OS_VERSION_BY_MODEL,
  generateContactName,
} from "@ledgerhq/live-e2e-shared/contacts";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceUnderTest } from "@ledgerhq/live-e2e-shared/mockServer/devices";
import { withInstallHashes } from "@ledgerhq/live-e2e-shared/mockServer/installedApps";
import {
  disposeMockServerSession,
  provisionMockServerSession,
} from "@ledgerhq/live-e2e-shared/mockServer/session";
import { getSpeculosModel } from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { launchApp } from "@e2e/helpers/commonHelpers";
import {
  LEDGER_SYNC_FEATURE_FLAGS,
  cleanupLedgerSyncAfterAll,
  setupLedgerSyncSeed,
  verifyLedgerSyncEnvironment,
} from "@e2e/helpers/ledgerSyncHelpers";
import { MockServerDevicePage } from "@e2e/page/mockServerDevice.page";
import { deleteSpeculos } from "@e2e/utils/speculosUtils";
import { FF_LWM_WALLET_40_Q2 } from "@e2e/utils/featureFlagUtils";
import type { PartialFeatures } from "@shared/feature-flags";

const CONTACT_NAME = generateContactName();
const RENAMED_CONTACT_NAME = generateContactName();
const ETHEREUM_ADDRESS = CONTACT_ADDRESS_DATASET.find(
  row => row.networkId === "ethereum" && !row.isEns,
);

// The contacts rc OS is published on manager provider 4. Provider 1 answers 404, and the
// app then stops on Invalid Provider before Ethereum opens.
const CONTACTS_APP_CATALOG_PROVIDER = 4;

const REGISTER_DEVICE_PROMPT_ID = "contacts-register-external-address-continue-on-device";
const RENAME_DEVICE_PROMPT_ID = "contacts-rename-contact-continue-on-device";

const CONTACTS_FEATURE_FLAGS: PartialFeatures = {
  lwmContacts: {
    enabled: true,
    params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
  },
  ...LEDGER_SYNC_FEATURE_FLAGS,
  ...FF_LWM_WALLET_40_Q2,
};

const CONTACTS_DEVICE_TAGS = [
  "@NanoSP",
  "@NanoX",
  "@Flex",
  "@NanoGen5",
  "@ethereum",
  "@family-evm",
];
const contactsOsVersion = CONTACTS_OS_VERSION_BY_MODEL[getSpeculosModel()];

const describeRenameOnMockServer = contactsOsVersion && ETHEREUM_ADDRESS ? describe : describe.skip;

describeRenameOnMockServer("Contacts - rename with an address (mock server)", () => {
  setupLedgerSyncSeed();
  cleanupLedgerSyncAfterAll();

  let mockServer: MockServerDevicePage | undefined;
  let session: { baseUrl: string; token: string } | undefined;

  beforeAll(async () => {
    if (!contactsOsVersion || !ETHEREUM_ADDRESS) {
      throw new Error("contacts rename mock server spec ran without a supported device");
    }

    const device = deviceUnderTest();
    const apps = (
      await withInstallHashes(
        device.modelId,
        [{ name: AppInfos.ETHEREUM.name, version: CONTACTS_ETHEREUM_APP_VERSION }],
        { firmware: contactsOsVersion, provider: CONTACTS_APP_CATALOG_PROVIDER },
      )
    ).map(app => {
      if (!app.version) throw new Error(`App "${app.name}" has no version`);
      return { name: app.name, version: app.version, hash: app.hash };
    });
    const { modelId, ...config } = {
      ...device,
      firmware_version: contactsOsVersion,
      apps,
    };
    session = await provisionMockServerSession([config]);
    mockServer = new MockServerDevicePage(session.baseUrl, session.token);

    await launchApp({
      newInstance: true,
      launchArgs: {
        mockServerToken: session.token,
        mockServerModel: modelId,
        forceProvider: String(CONTACTS_APP_CATALOG_PROVIDER),
        ...(process.env.MOCK_SERVER_TRANSPORT_URL
          ? { mockServerUrl: process.env.MOCK_SERVER_TRANSPORT_URL }
          : {}),
      },
    });
    await verifyLedgerSyncEnvironment();

    const trustchainCommands = [
      ...app.ledgerSync.initializeEmptyTrustchain(),
      (userdataPath?: string) => app.ledgerSync.saveTrustchainToUserdata(userdataPath),
    ];
    await app.init({
      userdata: "contacts",
      featureFlags: CONTACTS_FEATURE_FLAGS,
      cliCommands: [],
      cliCommandsOnApp: trustchainCommands.map(cmd => ({ app: AppInfos.LS, cmd })),
    });
    await deleteSpeculos();
    await app.mainNavigation.waitForWallet40Ready();
  });

  afterAll(async () => {
    if (!session) return;
    try {
      await disposeMockServerSession(session.baseUrl, session.token);
    } catch {
      // The session expires on its own. A failed dispose must not hide the spec result.
    }
  });

  setTeamOwner(Team.WALLET_XP);
  CONTACTS_DEVICE_TAGS.forEach(tag => $Tag(tag));

  it("Register an address and rename the contact on the device", async () => {
    if (!ETHEREUM_ADDRESS || !mockServer) {
      throw new Error("contacts rename mock server spec ran without a session");
    }

    await app.mainNavigation.openMyWallet();
    await app.myWallet.openContacts();
    await app.contacts.addContact(CONTACT_NAME);
    await app.contacts.expectSavedContactDisplayed(CONTACT_NAME);

    const contactRowId = await app.contacts.getSavedContactRowId(CONTACT_NAME);
    await app.contacts.openSavedContact(contactRowId);
    await app.contacts.detail.expectName(CONTACT_NAME);
    await app.contacts.detail.expectNoAddresses();

    await app.contacts.detail.addAddress(ETHEREUM_ADDRESS);
    await mockServer.confirmDeviceIntent(REGISTER_DEVICE_PROMPT_ID);
    await app.contacts.detail.expectAddressSaved(
      ETHEREUM_ADDRESS.savedValue,
      ETHEREUM_ADDRESS.networkId,
    );

    await app.contacts.detail.renameContact(RENAMED_CONTACT_NAME);
    await mockServer.confirmDeviceIntent(RENAME_DEVICE_PROMPT_ID);
    await app.contacts.detail.expectName(RENAMED_CONTACT_NAME);

    await app.common.goToPreviousPage();
    await app.contacts.expectScreenVisible();
    await app.contacts.deleteContact(contactRowId);
    await app.contacts.expectScreenVisible();
    await app.contacts.expectSavedContactRemoved(contactRowId);
    await app.contacts.expectEmptyState();
  });
});
