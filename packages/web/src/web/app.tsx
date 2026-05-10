import { Route, Switch } from "wouter";
import Landing from "./pages/landing";
import Generate from "./pages/generate";
import { Provider } from "./components/provider";
import { AgentFeedback } from "@runablehq/website-runtime";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/generate" component={Generate} />
      </Switch>
      {import.meta.env.DEV && <AgentFeedback />}
    </Provider>
  );
}

export default App;
