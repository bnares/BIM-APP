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
import "../../../../front/bimViewer/style.css"
import { render } from "react-dom";

export interface IChartData{
    labels:string[],
    data:number[],
}

export function IFCViewer(){
    const navigate = useNavigate();
    let {fileName} = useParams();
    if(fileName === undefined) return navigate("/");
    const [openModalCharts, setOpenModalCharts] = React.useState<boolean>(false);
    const [chartData, setChartData] = React.useState<IChartData>({labels:[], data:[]});
    const [barChartData, setBarChartData] = React.useState({});
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

        const ifcLoader = new OBC.FragmentIfcLoader(viewer);
        ifcLoader.settings.wasm = {
            path: "https://unpkg.com/web-ifc@0.0.44/",
            absolute: true
        }

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
            var data = await getAllToDo();
            for(var i =0; i<data.length; i++){
                var toDo = data[i];
                var createdToDoDataFromDb = Helper.CreateToDoDataObjectFromDbInfo(toDo);
                toDoData.push(createdToDoDataFromDb);
            }
            
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
                    var toDoSelected = toDoData.filter(x=>JSON.stringify(x.camera)==JSON.stringify(lookData));
                    highlighter.highlightByID("select",toDoSelected[0].fragmentMap);
                })

                card.onDeleteBtnClick.add(async (idNumberOfToDo)=>{
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

        var classifier = new OBC.FragmentClassifier(viewer);
        const classifications = classifier.get();


        const culler = new OBC.ScreenCuller(viewer);
        cameraComponent.controls.addEventListener("sleep",()=>{
            culler.needsUpdate = true;
        })
        viewerContainer.addEventListener("mouseup",()=>culler.needsUpdate=true);
        viewerContainer.addEventListener("wheel", ()=>culler.needsUpdate = true);

        const classifierWindow = new OBC.FloatingWindow(viewer);
        classifierWindow.visible = false;
        viewer.ui.add(classifierWindow);
        classifierWindow.title = "Model Group";
        var classifierBtn = new OBC.Button(viewer);
        classifierBtn.tooltip = "Model Group";
        classifierBtn.materialIcon="account_tree";
        classifierBtn.onClick.add(()=>{
            classifierWindow.visible = !classifierWindow.visible;
        })

        const hider = new OBC.FragmentHider(viewer);

        const createModelTree = async ()=>{
            const fragmentTree = new OBC.FragmentTree(viewer);
            await fragmentTree.init();
            fragmentTree.update([]);
            await fragmentTree.update(["model","storeys","entities"]);
            const tree = fragmentTree.get().uiElement.get("tree");
            await classifierWindow.slots.content.dispose(true);
            fragmentTree.onHovered.add((fragmentMap)=>{
                highlighter.highlightByID("hover",fragmentMap);
            });
            fragmentTree.onSelected.add((fragmentMap)=>{
                highlighter.highlightByID("select", fragmentMap);
            })
            return tree;
        }

        const asignElementCategoryToStyleMaterial = async (model : FragmentsGroup)=>{
            const found = await classifier.find({entities:["IFCWALL", "IFCBEAM", "IFCCOLUMN","IFCSLAB"]});
            console.log("found: ", found);
            for(const fragID in found){
                const {mesh} = fragmentManager.list[fragID];
                newStyleFilled.fragments[fragID] = new Set(found[fragID]);
                newStyleFilled.meshes.add(mesh);
            }

            const meshes = [];
            for(const fragment of model.items){
                const {mesh} = fragment;
                meshes.push(mesh);
                newStyleProjected.meshes.add(mesh);
            }
            materialManager.addMeshes("white", meshes);

        }
       
        const onModelLoaded = async (model : FragmentsGroup)=>{
           
            console.log(model);
            console.log(fragmentManager);
            //scene2d.add(model);
            //scene2d.add()
            var chartBarData = charts.countNumberOfElementsTypeInModel(model.properties);
            setBarChartData(chartBarData);
            highlighter.update();
            propertiesProcessor.process(model);
            classifier.byModel(model.ifcMetadata.name, model);
            classifier.byStorey(model);
            classifier.byEntity(model);
            const tree = await createModelTree();
            classifierWindow.addChild(tree);
            for(const fragment of model.items){
                culler.add(fragment.mesh);
            }

            
            await asignElementCategoryToStyleMaterial(model);
            await floorPLans.computeAllPlanViews(model);
            await floorPLans.updatePlansList()
            culler.needsUpdate = true;

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

        const dimensions = new OBC.LengthMeasurement(viewer);
        dimensions.color = new THREE.Color("red");
        dimensions.snapDistance =1;
        
        const areaMeasure = new OBC.AreaMeasurement(viewer);
        
        areaMeasure.uiElement.get("main").get().addEventListener("click",(event)=>{
            areaMeasure.create();
        })

        const clipper = new OBC.EdgesClipper(viewer);
        clipper.enabled = true;
        clipper.uiElement.get("main").active = false;
        const blueFill = new THREE.MeshBasicMaterial({color: 'lightblue', side: 2});
        const blueLine = new THREE.LineBasicMaterial({ color: 'blue' });
        const blueOutline = new THREE.MeshBasicMaterial({color: 'blue', opacity: 0.2, side: 2, transparent: true});
        clipper.styles.create("Red lines", new Set(fragmentManager.meshes), blueLine, blueFill, blueOutline);

        window.onkeydown = (event)=>{
            if(event.code ==="Delete" || event.code==="Backspace" || event.code ==="Escape"){
                clipper.deleteAll();
                dimensions.deleteAll();
                areaMeasure.deleteAll();
            }
        }

        viewerContainer.ondblclick = ()=>{
            clipper.create();
        }

        //floor plans part
        const sectionMaterial = new THREE.LineBasicMaterial({color:'black'});
        const filleMaterial = new THREE.MeshBasicMaterial({color:'gray', side:2});
        const fillOutline = new THREE.MeshBasicMaterial({color:'black', side:1, opacity:0.5, transparent:true});
        const newStyleFilled = clipper.styles.create("filled", new Set(), sectionMaterial, filleMaterial, fillOutline);
        const newStyleProjected = clipper.styles.create("projected", new Set(), sectionMaterial);
        const styles = clipper.styles.get();
        
        const whiteColor = new THREE.Color("white");
        const whiteMaterial = new THREE.MeshBasicMaterial({color:whiteColor});
        const materialManager = new OBC.MaterialManager(viewer);
        materialManager.addMaterial("white", whiteMaterial);

        const floorPLans = new OBC.FragmentPlans(viewer);

        const highlighterMaterial = new THREE.MeshBasicMaterial({
            color:'#BCF124',
            depthTest:false,
            opacity:0.8,
            transparent:true,
        });;
        highlighter.add("redSelection", [highlighterMaterial]);
        highlighter.outlineMaterial.color.set(0xf0ff7a);
        let lastSelection;
        let singleSelection = {
            value: true,
        }
        const canvas = rendererComponent.get().domElement;
        canvas.addEventListener("click", ()=>{
            highlighter.clear("redSelection");
        })
        highlighter.update();
        floorPLans.commands={
            "Select": async (plan)=>{
                if(plan){
                    console.log("Selected plan: ",plan);
                    const found = await classifier.find({storeys:[plan.name]});
                    console.log("FloorPlan select found: ",found);
                    highlighter.highlightByID("redSelection", found);
                    const floorsNamesToHide = Object.keys(classifier.get()['storeys']).filter(x=>x!=plan.name);
                    console.log("classifier.get() in select: ", classifier.get());
                    for(var floorName of floorsNamesToHide){
                        const foundFloor = await classifier.find({storeys:[floorName]});
                        hider.set(false, foundFloor);
                    }
                }
            },
            "Show":async (plan)=>{
                if(plan){
                    const found = await classifier.find({storeys:[plan.name]});
                    console.log("FloorPlan SHOW found: ",found);
                    hider.set(true, found);
                    const floorsNamesToShow = Object.keys(classifier.get()["storeys"]);
                    console.log("classifier.get() in show: ", classifier.get());
                    for(var floorName of floorsNamesToShow){
                        const foundFloor = await classifier.find({storeys:[floorName]});
                        hider.set(true, foundFloor);
                    }
                }
            },
            "Hide": async (plan)=>{
                if(plan){
                    const found = await classifier.find({storeys:[plan.name]});
                    console.log("FloorPlan Hide found: ",found);
                    hider.set(false, found);
                }
            }
        }

        const prepareFragmentMapToHideOrShowNotCurrentFloors = async ( showOrHide: boolean, currentFloorPLan: string)=>{
            var floorsNameList = Object.keys(classifier.get()["storeys"]);
            var floorsNameToHide = [];
            for(var floor of floorsNameList){
              //console.log("floor: ", flor);
              if(floor != currentFloorPLan) floorsNameToHide.push(floor)
            }
            console.log("Floors to hide: ", floorsNameToHide);
            for(var floorToHide of floorsNameToHide){
              const found = await classifier.find({storeys:[floorToHide]})
              console.log("data floors to hide: ",found);
              hider.set(showOrHide, found);
            }
        }

        floorPLans.onNavigated.add(()=>{
            rendererComponent.postproduction.customEffects.glossEnabled = false;
            materialManager.setBackgroundColor(whiteColor);
            materialManager.set(true,["white"]);
            grid.visible = false;
        })

        floorPLans.onExited.add(async ()=>{
            await prepareFragmentMapToHideOrShowNotCurrentFloors(true, "");
            rendererComponent.postproduction.customEffects.glossEnabled = true;
            materialManager.resetBackgroundColor();
            materialManager.set(false,["white"]);
            grid.visible = true;
        })

        const exploder = new OBC.FragmentExploder(viewer);

        

        const toolbar = new OBC.Toolbar(viewer);
        toolbar.addChild(
            //ifcLoader.uiElement.get("main"),
            classifierBtn,
            propertiesProcessor.uiElement.get("main"),
            todo.uiElement.get("activationButton"),
            charts.uiElement.get("activationButton"),
            aiRendererBtn,
            exploder.uiElement.get("main"),
            hider.uiElement.get("main"),
            //clipper.uiElement.get("main"),
            dimensions.uiElement.get("main"),
            areaMeasure.uiElement.get("main"),
            floorPLans.uiElement.get("main"),
        )
        viewer.ui.addToolbar(toolbar);
       
    }

    const getAllToDo = async ()=>{
        if(fileName) {
           var dataToDos = await agent.toDo.allToDos(fileName);
           return dataToDos;
        }
        else console.warn("wrong file name in url");
    }

    React.useEffect(() => {
        //getAllToDo();
        createViewer();
        //loadFile(fileName+".ifc");
        return () => {
          viewer.dispose();
          
        }
      }, [])

    return(
        <div
            id="viewer-container"
            className="dashboard-card"
            style={{ minWidth: 0, position: "relative" }}
        >
            <div>Test</div>
            {openModalCharts ? 
                <ModalChartsWindow 
                    open={openModalCharts} 
                    setOpen={setOpenModalCharts} 
                    chartData = {chartData}
                    barData={barChartData} 
                /> 
                    : null}
        </div>
    )

}