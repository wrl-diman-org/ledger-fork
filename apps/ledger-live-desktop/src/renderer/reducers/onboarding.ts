import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from ".";

interface SyncFlowState {
  seedConfiguration: string;
}
export interface OnboardingState {
  onboardingSyncFlow: null | SyncFlowState;
  isOnboardingReceiveFlow: boolean;
  isOnboardingReceiveSuccess: boolean;
  isSkipDrawerOpen: boolean;
  shouldResumeAddAccountAfterOnboarding: boolean;
  addAccountResumeTarget: AddAccountResumeTarget | null;
}

/** Where the last Add Account flow started and its asset, to resume it there after onboarding. */
export type AddAccountResumeTarget = { returnTo: string; currencyId: string };

/*
 * We have separate states for checking if is onboarding flow
 * as we want to keep the state pure for specific flows and their dependencies
 */
const initialState: OnboardingState = {
  onboardingSyncFlow: null,
  isOnboardingReceiveFlow: false,
  isOnboardingReceiveSuccess: false,
  isSkipDrawerOpen: false,
  shouldResumeAddAccountAfterOnboarding: false,
  addAccountResumeTarget: null,
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setIsOnboardingReceiveFlow: (
      state,
      action: PayloadAction<{ isFlow: boolean; isSuccess: boolean }>,
    ) => {
      state.isOnboardingReceiveFlow = action.payload.isFlow;
      state.isOnboardingReceiveSuccess = action.payload.isSuccess;
    },
    setOnboardingSyncFlow: (state, action: PayloadAction<null | SyncFlowState>) => {
      state.onboardingSyncFlow = action.payload;
    },
    setSkipDrawerVisibility: (state, action: PayloadAction<boolean>) => {
      state.isSkipDrawerOpen = action.payload;
    },
    setShouldResumeAddAccountAfterOnboarding: (state, action: PayloadAction<boolean>) => {
      state.shouldResumeAddAccountAfterOnboarding = action.payload;
    },
    setAddAccountResumeTarget: (state, action: PayloadAction<AddAccountResumeTarget>) => {
      state.addAccountResumeTarget = action.payload;
    },
  },
});

export const onboardingSyncSkipDrawerVisibilitySelector = (state: {
  onboarding: OnboardingState;
}) => state.onboarding.isSkipDrawerOpen;
export const onboardingIsSyncFlowSelector = (state: State) =>
  state.onboarding.onboardingSyncFlow !== null;
export const onboardingSyncFlowSelector = (state: State) => state.onboarding.onboardingSyncFlow;
export const onboardingReceiveFlowSelector = (state: State) =>
  state.onboarding.isOnboardingReceiveFlow;
export const onboardingReceiveSuccessSelector = (state: State) =>
  state.onboarding.isOnboardingReceiveSuccess;
export const shouldResumeAddAccountAfterOnboardingSelector = (state: State) =>
  state.onboarding.shouldResumeAddAccountAfterOnboarding;
/** The Add Account flow waiting to resume after device onboarding, if any. */
export const pendingAddAccountResumeSelector = (state: State) =>
  state.onboarding.shouldResumeAddAccountAfterOnboarding
    ? state.onboarding.addAccountResumeTarget
    : null;

export const {
  setIsOnboardingReceiveFlow,
  setOnboardingSyncFlow,
  setSkipDrawerVisibility,
  setShouldResumeAddAccountAfterOnboarding,
  setAddAccountResumeTarget,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
