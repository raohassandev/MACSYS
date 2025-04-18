// import React, { useMemo } from 'react';

// import ReactApexChart from 'react-apexcharts';

// interface TemperatureGaugeProps {
//   temperature: number; // e.g. 24.5
// }

// export const TemperatureGauge: React.FC<TemperatureGaugeProps> = ({
//   temperature,
// }) => {
//   const { series, options } = useMemo(() => {
//     // Determine comfort color based on temperature
//     let color = '#ABE5A1'; // default green

//     if (temperature < 22) color = '#00BFFF'; // blue - cold
//     else if (temperature >= 22 && temperature <= 26)
//       color = '#00E396'; // green - comfortable
//     else if (temperature > 26 && temperature <= 30)
//       color = '#FFD700'; // yellow - warm
//     else if (temperature > 30) color = '#FF4560'; // red - hot

//     return {
//       series: [parseFloat(temperature.toFixed(1))],
//       options: {
//         chart: {
//           height: 350,
//           type: 'radialBar',
//           toolbar: {
//             show: false,
//           },
//         },
//         plotOptions: {
//           radialBar: {
//             startAngle: -135,
//             endAngle: 225,
//             hollow: {
//               size: '70%',
//               background: '#fff',
//               dropShadow: {
//                 enabled: true,
//                 top: 3,
//                 blur: 4,
//                 opacity: 0.5,
//               },
//             },
//             track: {
//               background: '#fff',
//               strokeWidth: '67%',
//               dropShadow: {
//                 enabled: true,
//                 top: -3,
//                 blur: 4,
//                 opacity: 0.7,
//               },
//             },
//             dataLabels: {
//               name: {
//                 offsetY: -10,
//                 color: '#888',
//                 fontSize: '17px',
//               },
//               value: {
//                 formatter: () => `${temperature.toFixed(1)}°C`,
//                 color: '#111',
//                 fontSize: '36px',
//               },
//             },
//           },
//         },
//         fill: {
//           type: 'gradient',
//           gradient: {
//             shade: 'dark',
//             type: 'horizontal',
//             shadeIntensity: 0.5,
//             gradientToColors: [color],
//             inverseColors: true,
//             opacityFrom: 1,
//             opacityTo: 1,
//             stops: [0, 100],
//           },
//         },
//         stroke: {
//           lineCap: 'round',
//         },
//         labels: ['Temperature'],
//       },
//     };
//   }, [temperature]);

//   return (
//     <div>
//       <ReactApexChart
//         options={options}
//         series={series}
//         type='radialBar'
//         height={350}
//       />
//     </div>
//   );
// };

import React, { useMemo } from 'react';

import ReactApexChart from 'react-apexcharts';

interface TemperatureGaugeProps {
  temperature: number; // temperature value to display
}

export const TemperatureGauge: React.FC<TemperatureGaugeProps> = ({
  temperature,
}) => {
  const { series, options } = useMemo(() => {
    // Select gradient color based on temperature comfort level
    let color = '#00E396'; // comfortable

    if (temperature < 22) color = '#00BFFF'; // cold - blue
    else if (temperature > 26 && temperature <= 30)
      color = '#FFD700'; // warm - yellow
    else if (temperature > 30) color = '#FF4560'; // hot - red

    return {
      series: [parseFloat(temperature.toFixed(1))],
      options: {
        chart: {
          height: 350,
          type: 'radialBar',
          toolbar: { show: false },
        },
        plotOptions: {
          radialBar: {
            startAngle: -135,
            endAngle: 225,
            hollow: {
              size: '70%',
              background: '#fff',
              dropShadow: {
                enabled: true,
                top: 3,
                blur: 4,
                opacity: 0.5,
              },
            },
            track: {
              background: '#fff',
              strokeWidth: '67%',
              dropShadow: {
                enabled: true,
                top: -3,
                blur: 4,
                opacity: 0.7,
              },
            },
            dataLabels: {
              name: {
                offsetY: -10,
                color: '#888',
                fontSize: '17px',
              },
              value: {
                formatter: () => `${temperature.toFixed(1)}°C`,
                color: '#111',
                fontSize: '36px',
              },
            },
          },
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'horizontal',
            shadeIntensity: 0.5,
            gradientToColors: [color],
            inverseColors: true,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 100],
          },
        },
        stroke: {
          lineCap: 'round',
        },
        labels: ['Temperature'],
      },
    };
  }, [temperature]);

  return (
    <div>
      <ReactApexChart
        options={options}
        series={series}
        type='radialBar'
        height={350}
      />
    </div>
  );
};