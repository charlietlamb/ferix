import type {
  DiscoveryCompletedEvent,
  DiscoveryStartedEvent,
} from "../../../domain/index.js";
import type { StateReducer } from "./registry.js";
import { stateReducerRegistry } from "./registry.js";

const discoveryStartedReducer: StateReducer<"DiscoveryStarted"> = {
  tag: "DiscoveryStarted",
  reduce: (state, _event: DiscoveryStartedEvent) => ({
    ...state,
    discoveryInProgress: true,
    discoveryCompleted: false,
    executionMode: "discovery",
  }),
};

const discoveryCompletedReducer: StateReducer<"DiscoveryCompleted"> = {
  tag: "DiscoveryCompleted",
  reduce: (state, _event: DiscoveryCompletedEvent) => ({
    ...state,
    discoveryInProgress: false,
    discoveryCompleted: true,
    executionMode: "idle",
  }),
};

stateReducerRegistry.register(discoveryStartedReducer);
stateReducerRegistry.register(discoveryCompletedReducer);
