import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Router from "react-router-dom"
import { IFCViewer } from './react-component/IFCViewer';
import Home from './react-component/Home';
import { ViewerProvider } from './react-component/ReactBimContext';




const rootElement = document.getElementById("app") as HTMLDivElement;
const appRoot = ReactDOM.createRoot(rootElement);
appRoot.render(

    <Router.BrowserRouter>
      <ViewerProvider>
        <Router.Routes>
          <Router.Route path='/' element={<Home />}></Router.Route>
          <Router.Route path={"/:fileName"} element={<IFCViewer />}></Router.Route>
        </Router.Routes>
      </ViewerProvider>
    </Router.BrowserRouter>
  
)
