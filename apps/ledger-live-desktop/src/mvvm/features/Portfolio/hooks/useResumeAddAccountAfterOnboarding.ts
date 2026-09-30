import { useEffect } from "react";
import { useLocation } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import {
  pendingAddAccountResumeSelector,
  setShouldResumeAddAccountAfterOnboarding,
} from "~/renderer/reducers/onboarding";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { useShouldRedirect } from "~/renderer/hooks/useAutoRedirectToPostOnboarding/useShouldRedirect";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { setOriginFlow } from "~/renderer/analytics/originFlow";

/**
 * Resumes the Add Account flow that was interrupted to send the user through device onboarding,
 * on the screen it started from. `open` defaults to the generic Add Account asset flow.
 */
export const useResumeAddAccountAfterOnboarding = (
  open?: (currencyIds?: string[]) => void,
): void => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const pendingResume = useSelector(pendingAddAccountResumeSelector);
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const { shouldRedirectToRecoverUpsell } = useShouldRedirect();
  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "portfolio_add_account",
  );

  useEffect(() => {
    if (!pendingResume || pathname !== pendingResume.returnTo) return;
    if (!hasOnboardedDevice || shouldRedirectToRecoverUpsell) return;
    dispatch(setShouldResumeAddAccountAfterOnboarding(false));
    setOriginFlow(HOOKS_TRACKING_LOCATIONS.addAccountModal);
    const currencyIds = [pendingResume.currencyId];
    if (open) open(currencyIds);
    else openAssetFlow(undefined, currencyIds);
  }, [
    dispatch,
    hasOnboardedDevice,
    open,
    openAssetFlow,
    pathname,
    pendingResume,
    shouldRedirectToRecoverUpsell,
  ]);
};
