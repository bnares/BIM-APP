import * as React from "react";
import * as OBC from "openbim-components";
import { useNavigate, useParams } from "react-router-dom";
import { cloneUniformsGroups } from "three";
import { FragmentsGroup } from "bim-fragment";
import { ToDoCreator, ToDoData } from "../bim-components/todo";
import { ViewerContext } from "./ReactBimContext";
import * as THREE from "three";
import { ToDoCard } from "../bim-components/todo/src/ToDoCard";
import { ChartsCreator } from "../bim-components/charts";
import PieChartWithLabel from "./charts/PieChartWithLabel";
import { ModalChartsWindow } from "./ModawWindow/ModalChartsWindow";
import agent from "../api/agent";
import { Helper } from "../helpers/HelperMethods";

export interface IChartData{
    labels:string[],
    data:number[],
}

export function IFCViewer(){
    const navigate = useNavigate();
    let {fileName} = useParams();
    if(fileName === undefined) return navigate("/");
    //const [ifcLoad, setIfcLoad] = React.useState<null | OBC.FragmentIfcLoader>(null)
    //const [fragMana, setFragMana] = React.useState<null | OBC.FragmentManager>(null);
    //const {model, setModel} = React.useContext(ViewerContext);
    //const [listToDoData, setListToDoData] = React.useState<ToDoData[]>([]);
    const [openModalCharts, setOpenModalCharts] = React.useState<boolean>(false);
    const [chartData, setChartData] = React.useState<IChartData>({labels:[], data:[]});
    //const [loadedModelToDos, setLoadedModelToDos] = React.useState([]);
    var modelElementSelected : any[] = [];
    console.log("useParams fileName: ", fileName);
    let viewer : OBC.Components;
    let toDoCardComponentList : ToDoCard[] = [];
    let toDoData: ToDoData[] = [];
    const createViewer = async () => {
        
        viewer = new OBC.Components()
        
        const sceneComponent = new OBC.SimpleScene(viewer)
        sceneComponent.setup()
        viewer.scene = sceneComponent
        const scene = sceneComponent.get()
        //scene.background = null
    
        const viewerContainer = document.getElementById("viewer-container") as HTMLDivElement
        const rendererComponent = new OBC.PostproductionRenderer(viewer, viewerContainer)
        viewer.renderer = rendererComponent
    
        const cameraComponent = new OBC.OrthoPerspectiveCamera(viewer)
        viewer.camera = cameraComponent
        
        const raycasterComponent = new OBC.SimpleRaycaster(viewer)
        viewer.raycaster = raycasterComponent
    
        viewer.init()
        cameraComponent.updateAspect()
        rendererComponent.postproduction.enabled = true;

        
        const spinner = new OBC.Spinner(viewer)
        
        viewer.ui.add(spinner);
        spinner.active = true;
        spinner.visible = true;
        const fragmentManager = new OBC.FragmentManager(viewer);
        //setFragMana(fragmentManager);

        const ifcLoader = new OBC.FragmentIfcLoader(viewer);
        ifcLoader.settings.wasm = {
            path: "https://unpkg.com/web-ifc@0.0.44/",
            absolute: true
        }
        //setIfcLoad(ifcLoader);

        const highlighter = new OBC.FragmentHighlighter(viewer);
        highlighter.setup();

        const propertiesProcessor = new OBC.IfcPropertiesProcessor(viewer)
        highlighter.events.select.onClear.add(()=>{
            propertiesProcessor.cleanPropertiesList();
        })

        const loadFile = async (fileName: string)=>{
            const file = await fetch(`./${fileName}`);
            const arrayBuffer = await file.arrayBuffer();
            const setoUint = new Uint8Array(arrayBuffer);
            const model = await ifcLoader.load(setoUint,fileName);
            //setLoadedModel(model);
            viewer.scene.get().add(model);
            

        }

        const loadFragFile = async (fileName : string)=>{
            const file = await fetch(`./${fileName}`);
            const arrayBuffer = await file.arrayBuffer();
            const uintArray = new Uint8Array(arrayBuffer);
            await fragmentManager.load(uintArray);
            spinner.active = false;
            spinner.visible = false;
        }

        const loadFragModelProperites = async (model : FragmentsGroup)=>{
            await fetch(`./${fileName}.txt`)
                .then(response=> response.text())
                .then(textRes=> {model.properties = JSON.parse(textRes)});

        }

        fragmentManager.onFragmentsLoaded.add(async (model : FragmentsGroup)=>{
            await loadFragModelProperites(model);
            onModelLoaded(model);
        })

        //loadFile(fileName+".ifc");
        loadFragFile(fileName+".frag");
        var colorGrid = new THREE.Color("rgb(129, 133, 137)");
        const grid = new OBC.SimpleGrid(viewer, colorGrid);

        const todo = new ToDoCreator(viewer);
        todo.setup();

        const getStorageToDoInDatabase = async ()=>{
            //console.log("loaded model: ", loadedModelToDos);
            var data = await getAllToDo();
            console.log("getAllToDo function: ", data);
            for(var i =0; i<data.length; i++){
                var toDo = data[i];
                console.log("single toDo: ", toDo);
                var createdToDoDataFromDb = Helper.CreateToDoDataObjectFromDbInfo(toDo);
                toDoData.push(createdToDoDataFromDb);
            }
            
           console.log("allList of pushed toDo: ", toDoData);
            for(var storageToDo of data){
                
                var card = new ToDoCard(viewer, storageToDo.id);
                toDoCardComponentList.push(card);
                card.date = new Date(storageToDo.date);
                card.description = storageToDo.description;
                card.status = storageToDo.status;
                const idOfToDoElementComponent = card.getIdNumberOfToDo() as number;
                const lookData = JSON.parse(storageToDo.camera);
                const fragmentMapWithArray = JSON.parse(storageToDo.fragmentMap);
                var fragmentMapWithSet:any = {};
                for(var fragmentMapIdKey of Object.keys(fragmentMapWithArray)){
                    var valueArray = fragmentMapWithArray[fragmentMapIdKey];
                    var newSet = new Set<string>();
                    for(var expressId of valueArray){
                        newSet.add(expressId);
                    }
                    fragmentMapWithSet[fragmentMapIdKey] = newSet;
                }

                card.onCardClick.add(()=>{
                    var cameraComponent = viewer.camera;
                    if(!(cameraComponent instanceof OBC.OrthoPerspectiveCamera)) return;
                    if(fragmentMapWithSet.length==0) return;
                    cameraComponent.controls.setLookAt(lookData.position.x,lookData.position.y, lookData.position.z, lookData.target.x, lookData.target.y, lookData.target.z,true);
                    console.log("fragmentMap to select: ", fragmentMapWithSet);
                    var toDoSelected = toDoData.filter(x=>JSON.stringify(x.camera)==JSON.stringify(lookData));
                    //highlighter.highlightByID("select",fragmentMapWithSet);
                    highlighter.highlightByID("select",toDoSelected[0].fragmentMap);
                })

                card.onDeleteBtnClick.add(async (idNumberOfToDo)=>{
                    var allToDoInCard = todo.uiElement.get("floatingWindow").children;
                    for(var toDoCardUIComponent of allToDoInCard){
                        var toDoComponentData = toDoCardUIComponent.get();
                        
                    }
                    
                    var idOfToDoToDelete = (card.getIdNumberOfToDo()) as number;
                    var cardToDelete = toDoCardComponentList.find(x=>x.getIdNumberOfToDo()==idNumberOfToDo);
                    if(idNumberOfToDo ==0 || !cardToDelete) return;
                    await agent.toDo.deleteToDo( idNumberOfToDo).catch(e=>console.warn(e));
                    todo.uiElement.get("floatingWindow").removeChild(cardToDelete);
                    toDoCardComponentList = toDoCardComponentList.filter(x=>x.getIdNumberOfToDo()!=idNumberOfToDo);
                    await cardToDelete.dispose();
                })

                todo.uiElement.get("floatingWindow").addChild(card);
            }
        }

       
        const onModelLoaded = async (model : FragmentsGroup)=>{
            highlighter.update();
            propertiesProcessor.process(model);

            highlighter.events.select.onClear.add(()=>{
                modelElementSelected = [];
            })

            highlighter.events.select.onHighlight.add((fragmentMap)=>{
                //modelElementSelected = [];
                const expressID = [...Object.values(fragmentMap)[0]][0];
                propertiesProcessor.renderProperties(model,Number(expressID));
                if(model.properties){
                    const allModelElementData = Object.values(model.properties);
                    for(var expressIdSet of Object.values(fragmentMap)){
                        expressIdSet.forEach(id=>{
                            const elementModel = model.properties[Number(id)];
                            modelElementSelected.push(elementModel);
                        })
                    }
                }else{
                    console.warn("Model does not have properties");
                }
            })

            await getStorageToDoInDatabase();

            const dataToDoToSend = async (data : ToDoData,convertedFragmentMap: any ,target: THREE.Vector3, position: THREE.Vector3, arrayOfGlobalId: string[])=>{
                var dataToSend = {
                    date: data.date, 
                    description: data.description,
                    status: data.status,
                    fragmentMap: JSON.stringify(convertedFragmentMap), 
                    camera:JSON.stringify({target, position}), 
                    globalId: arrayOfGlobalId,
                    fileName: fileName == undefined ? "" : fileName,
                }
                await agent.toDo.addToDo(dataToSend).catch(e=>console.warn(e));
            }

            todo.onToDoFormAccepted.add(async ({status, description})=>{
                var position = new THREE.Vector3();
                var target = new THREE.Vector3();
                var camera = viewer.camera;
                if(!(camera instanceof OBC.OrthoPerspectiveCamera)) return;
                camera.controls.getTarget(target);
                camera.controls.getPosition(position);
                var SelectedElementFragmentMap = highlighter.selection.select;
                if(Object.values(SelectedElementFragmentMap).length==0) return;
                var selectedElementId = Object.values(SelectedElementFragmentMap);
               
                var arrayOfGlobalId : string[] = [];
                for(var setOfId of selectedElementId){
                    var arrayOfIds = Array.from(setOfId).filter(x=>!x.includes("."));
                    for(var idString of arrayOfIds){
                        var idNumber = Number(idString);
                        if(!model.properties) return;
                        var elementData = model.properties[idNumber];
                        var globalId = elementData["GlobalId"].value;
                        arrayOfGlobalId.push(globalId);
                    }
                }

                var convertedFragmentMapWithArray : any = {};
                for(var fragmentKey of Object.keys(SelectedElementFragmentMap)){
                    var setId =  SelectedElementFragmentMap[fragmentKey];
                    convertedFragmentMapWithArray[fragmentKey] = Array.from(setId);
                }
                
                var dataToAdd : ToDoData = {
                    date: new Date(), 
                    description,
                    status,
                    fragmentMap:SelectedElementFragmentMap, 
                    camera:{target, position}, 
                    globalId: arrayOfGlobalId,
                    fileName: fileName == undefined ? "" : fileName,
                };
                await dataToDoToSend(dataToAdd,convertedFragmentMapWithArray,target,position,arrayOfGlobalId);
                toDoData.push(dataToAdd);
                var card = new ToDoCard(viewer);
                card.description = description;
                card.date = dataToAdd.date;
                card.status = dataToAdd.status;
                toDoCardComponentList.push(card);
    
                card.onCardClick.add(()=>{
                    var camera1 = viewer.camera;
                    if(!(camera1 instanceof OBC.OrthoPerspectiveCamera)) return;
                    if(Object.keys(dataToAdd.fragmentMap).length==0) return;
                    camera1.controls.setLookAt(dataToAdd.camera.position.x, dataToAdd.camera.position.y, dataToAdd.camera.position.z, dataToAdd.camera.target.x, dataToAdd.camera.target.y, dataToAdd.camera.target.z, true);
                    highlighter.highlightByID("select", dataToAdd.fragmentMap);
                    //console.log("coresponded Data: ", dataToAdd);
                    
                })
    
                
        
                card.onDeleteBtnClick.add(toDoCard=>{
                    todo.uiElement.get("floatingWindow").removeChild(card);
                    toDoCardComponentList = toDoCardComponentList.filter(x=>x.getIdNumberOfToDo()!=card.getIdNumberOfToDo());
                    card.dispose();
                    
                })
    
                todo.uiElement.get("floatingWindow").addChild(card);
               
            })

            spinner.visible = false;
            spinner.active = false;
        }


        ifcLoader.onIfcLoaded.add(async (model)=>{
           onModelLoaded(model);
        })

       

        todo.onColorizeBtnClick.add(async ({active})=>{
            
            if(active){
                var createdFragmentMap:{[k:string]: Set<string>} = {};
                var usedStatus : string[]= [];
               
                for(var toDo of toDoData){
                    if(!usedStatus.includes(toDo.status as string)){
                        usedStatus.push(toDo.status as string);
                    }
                }

                for(var statusName of usedStatus){
                    var groupedToDoByStatus = toDoData.filter(x=>x.status as string ==statusName);
                    var createdFragmentMap:{[k:string]: Set<string>} = {};
                    for(var toDoElement of groupedToDoByStatus){
                        var fragmentMapId = Object.keys(toDoElement.fragmentMap);
                        for(var fragmentId of fragmentMapId){
                            if(Object.keys(createdFragmentMap).includes(fragmentId)){
                                for(var expressIdInFragmentMap of toDoElement.fragmentMap[fragmentId]){
                                    createdFragmentMap[fragmentId] = createdFragmentMap[fragmentId].add(expressIdInFragmentMap);
                                }
                            }else{
                                var setWithExpressId = toDoElement.fragmentMap[fragmentId];
                                createdFragmentMap[fragmentId] = setWithExpressId;
                            }
                        }
                    }
                    if(Object.values(createdFragmentMap).length==0) return;
                    await highlighter.highlightByID(`${ToDoCreator.uuid}-${statusName}`,createdFragmentMap);
                    
                }
                
               
            }else{
                highlighter.clear(`${ToDoCreator.uuid}-Active`);
                highlighter.clear(`${ToDoCreator.uuid}-Pending`);
                highlighter.clear(`${ToDoCreator.uuid}-Finished`);
            }
        })

        var charts = new ChartsCreator(viewer, toDoData);
        charts.setUI();

        const prepareChartData = ()=>{
            var dataToSend : IChartData = {labels:[], data:[]};
            var dictData: {[k:string]:number} = {}; 
            for(var todo of toDoData){
                var statusName = todo.status as string;
                if(Object.keys(dictData).includes(statusName)){
                    
                    dictData[statusName] = dictData[statusName]+ todo.globalId.length;
                }else{
                    dictData[statusName] = todo.globalId.length;
                }
            }

            for(var statusCreated in dictData){
                dataToSend.labels.push(statusCreated);
                dataToSend.data.push(dictData[statusCreated]);
            }
            return dataToSend;
        }

        charts.onUiElementBtnClicked.add(()=>{
            var chartDataToSend = prepareChartData();
            setChartData(chartDataToSend);
            setOpenModalCharts(value=>!value);
        })

        const aiRendererBtn = new OBC.Button(viewer);
        aiRendererBtn.materialIcon = "photo_camera";
        aiRendererBtn.tooltip = "Visualization";

        aiRendererBtn.onClick.add(async()=>{
            const renderer = rendererComponent.get();
            rendererComponent.postproduction.composer.render(); //forcing program to make render
            const image = renderer.domElement.toDataURL("image/jpeg"); //it gives an image of what you see in the screen

        })

        const toolbar = new OBC.Toolbar(viewer);
        toolbar.addChild(
            //ifcLoader.uiElement.get("main"),
            propertiesProcessor.uiElement.get("main"),
            todo.uiElement.get("activationButton"),
            charts.uiElement.get("activationButton"),
            aiRendererBtn,
        )
        viewer.ui.addToolbar(toolbar);
       
    }

    const getAllToDo = async ()=>{
        if(fileName) {
           var dataToDos = await agent.toDo.allToDos(fileName);
           return dataToDos;
           //console.log("dataToDos: ", dataToDos);
           //setLoadedModelToDos(dataToDos);
        }
        else console.warn("wrong file name in url");
    }

    React.useEffect(() => {
        //getAllToDo();
        createViewer();
        //loadFile(fileName+".ifc");
        return () => {
          viewer.dispose();
          //if(ifcLoad) ifcLoad.dispose();
          //setIfcLoad(null);
          //loadedModel?.dispose();
          //setLoadedModel(null);
          //fragMana?.dispose();
          //setFragMana(null);
          //setListToDoData([]);
          
        }
      }, [])

    return(
        <div
            id="viewer-container"
            className="dashboard-card"
            style={{ minWidth: 0, position: "relative" }}
        >
            <div>Test</div>
            {openModalCharts ? <ModalChartsWindow open={openModalCharts} setOpen={setOpenModalCharts} chartData = {chartData} /> : null}
        </div>
    )

}