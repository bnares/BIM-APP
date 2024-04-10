import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import PieChartWithLabel from '../charts/PieChartWithLabel';
import {Chart, CategoryScale, LinearScale, BarElement, Tooltip, ArcElement}  from "chart.js";
import {Bar, Doughnut} from "react-chartjs-2";
import { IChartData } from '../IFCViewer';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  ArcElement,
  );

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export interface IModalDataSend{
  open: boolean,
  setOpen: (value:boolean)=>{},
  chartData : IChartData,
}

export function ModalChartsWindow(props: IModalDataSend) {
  //const [open, setOpen] = React.useState(false);
  const handleOpen = () => props.setOpen(true);
  const handleClose = () => props.setOpen(false);
  
  

  return (
    <div>
      {/* <Button onClick={handleOpen}>Open modal</Button> */}
      <Modal
        open={props.open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h4" component="h2" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
            TO DO CHARTS
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            <Bar 
              data={{
                labels:props.chartData.labels, 
                datasets:[
                  {
                    //label:"Revenue",
                    data: props.chartData.data ,
                    backgroundColor: ['yellow', 'aqua', 'lightgreen'],
                    borderColor: ['red', 'blue', 'green'],
                    borderWidth: 2,
                    borderRadius:5
                  },
                ],
              }}
              options={{
                plugins:{
                  tooltip:{
                    enabled:true,
                  }
                },
                scales:{
                  y:{
                    ticks:{
                      stepSize:1
                    }
                  }
                }
              }}
            />
            <Doughnut 
               data={{
                labels:props.chartData.labels, 
                datasets:[
                  {
                    //label:"Revenue",
                    data: props.chartData.data ,
                    backgroundColor: ['yellow', 'aqua', 'lightgreen'],
                    borderColor: ['red', 'blue', 'green'],
                    borderWidth: 2,
                    borderRadius:5
                  },
                ],
              }}
              options={{
                plugins:{
                  tooltip:{
                    enabled:true,
                  }
                },
                
              }}
            />
          </Typography>
        </Box>
      </Modal>
    </div>
  );
}