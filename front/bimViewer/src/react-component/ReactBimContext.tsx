import { FragmentsGroup } from "bim-fragment";
import * as OBC from "openbim-components";
import React from "react";

interface IViewerContext{
    model: any,
    setModel: (data : FragmentsGroup | null)=>void,
}

export const ViewerContext = React.createContext<IViewerContext>({
    model : null,
    setModel:()=>{},
})

export function ViewerProvider(props:{children: React.ReactNode}){
    const [model, setModel] = React.useState<any>();
    return(
        <ViewerContext.Provider value = {{model, setModel}}>
            {props.children}
        </ViewerContext.Provider>
    )
}