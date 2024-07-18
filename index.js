async function loadInitialChart()
            {
                //Draw the first three scenes 
                drawLandCoverChart1(2002, 1);     
                drawLandCoverChart2(2010, 2);
                drawLandCoverChart3(2020, 3);

                //Draw Year bars
                drawYearBars(2002);

                //Draw Chart
                drawLandCoverChart(2002, "");
            }
            function drawYearBars (year)
            {
                console.log('drawYearBars')
                d3.select('#yearsBar')
                    .selectAll('*')
                    .remove();

                // Previous Year Button
                yearsBar = d3.select('#yearsBar')
                    .append('g')
                        .attr('transform','translate(0, 0)')
                    .append('button')   
                        .text('Prev')
                        .on("click", function(d) { 
                            year = year == 2002 ? year : year - 1;
                            drawYearBars(year);
                            redrawChart(year);
                        });

                var yearsSelection = ['2002','2003','2004','2005', "2006", "2007", "2008", "2009", "2010", "2011", '2012','2013','2014','2015', "2016", "2017", "2018", "2019", "2020", "2021", "2022"]
                
                yearsBar = d3.select('#yearsBar')
                    .append('g')
                        .attr('transform','translate(0, 0)')
                    .selectAll('p')
                    .data(yearsSelection)
                    .enter()
                    .append('p')
                        .attr("text-anchor", "start")
                        .attr('style', function(d, i) {
                            let color = d == year ? 'lightblue' : 'white';
                            return 'background-color:' + color
                        })
                        .attr('id', 'year_elements')
                        .text(function(d, i) {return d});

                // Next Year Button
                yearsBar = d3.select('#yearsBar')
                    .append('g')
                        .attr('transform','translate(0, 0)')
                    .append('button')  
                        .attr('height', 300) 
                        .text('Next')
                        .on("click", function(d) { 
                            year = year == 2022 ? year : year + 1;
                            drawYearBars(year);
                            redrawChart(year);
                        });
            }
            function drawAnnotations(annotations, chartNumber)
            {
                console.log('drawAnnotations for chart '+chartNumber)

                // Add annotation to the chart
                const makeAnnotations = d3.annotation()
                    .annotations(annotations)

                d3.select("#landCoverChart"+chartNumber)
                    .select('#annotations_labels')
                    .remove();

                d3.select("#landCoverChart"+chartNumber)
                    .append("g")
                        .attr('id', 'annotations_labels')
                    .call(makeAnnotations)
            }
            async function redrawChart(year)
            {
                console.log('redrawChart')

                let data = await loadData();

                let year_data = data[0];
                let country_data = data[1];

                let landCover_names = [];
                let landCover_values = [];
                for (const [landcover, landcover_value] of Object.entries(year_data[year]))
                {
                    landCover_names.push(landcover);
                    landCover_values.push(landcover_value);
                }
                //Add twice the # of items in array with fake values for tooltip hover
                for (let i = 0; i < landCover_names.length; i++)
                {
                    landCover_values.push(0)
                }

                let x_scale = d3.scaleLinear().domain([Math.min(...landCover_values), Math.max(...landCover_values)]).range([0, 900]);
                let y_scale = d3.scaleBand().domain(landCover_names).range([0, 500]);

                //Clear all annotations
                d3.select("#landCoverChart")
                    .select('#annotations_labels')
                    .remove();

                let tooltip = d3.select('#tooltip');
                
                d3.select('#landCoverChart')
                    .selectAll('rect')
                    .on("mouseover", function(d, i) {
                        let landcover_name = i >= landCover_names.length ? landCover_names[i - landCover_names.length] : landCover_names[i];
                        let areaBurnt = i >= landCover_names.length ? landCover_values[i - landCover_names.length] : landCover_values[i];

                        tooltip.style('opacity', 1)
                            .style("left",(d3.event.pageX)+"px")
                            .style("top",(d3.event.pageY)+"px")
                            .html(function () {
                                return "Landcover: "+landcover_name +"<br>Area burnt: " + (areaBurnt/1000000).toFixed(2) +" million ha (hectare)";
                            });
                    })
                    .on("mouseout", function(d, i) {
                        tooltip.style('opacity', 0);
                    })
                    .transition().duration(1000)
                    .attr('x', function(d, i) { return i >= landCover_names.length ? x_scale(landCover_values[i - landCover_names.length]) : 0})
                    .attr('y', function(d, i) { 
                        let y = i >= landCover_names.length ? y_scale(landCover_names[i - landCover_names.length]) : y_scale(landCover_names[i])
                        return y + (y_scale.bandwidth() * 0.1);
                    })
                    .attr('height', y_scale.bandwidth() * 0.8)
                    .attr('width', function(d, i) { return i >= landCover_names.length ? (900 - x_scale(landCover_values[i - landCover_names.length])) : x_scale(landCover_values[i])});
                    
                //Draw annotations last
                let annotations = await calculateAnnotations(year_data, x_scale, year);
                drawAnnotations(annotations, "");
            }
            async function drawLandCoverChart(year, chartNumber)
            {
                console.log('drawLandCoverChart for chart '+chartNumber)
                const legendColors = ['red','yellow','blue','green','magenta']

                let data = await loadData();

                let year_data = data[0];
                let country_data = data[1];

                let landCover_names = [];
                let landCover_values = [];
                for (const [landcover, landcover_value] of Object.entries(year_data[year]))
                {
                    landCover_names.push(landcover);
                    landCover_values.push(landcover_value);
                }
                //Add twice the # of items in array with fake values for tooltip hover (Using landCover_values)
                for (let i = 0; i < landCover_names.length; i++)
                {
                    landCover_values.push(0)
                }

                let x_scale = d3.scaleLinear().domain([Math.min(...landCover_values), Math.max(...landCover_values)]).range([0, 900]);
                let y_scale = d3.scaleBand().domain(landCover_names).range([0, 500]);

                let tooltip = d3.select('#tooltip');

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(35,100)')
                    .selectAll('rect')
                    .data(landCover_values)
                    .enter()
                    .append('rect')
                        .attr('id', 'landCover_rectangle')
                        .attr('x', function(d, i) { return i >= landCover_names.length ? x_scale(landCover_values[i - landCover_names.length]) : 0})
                        .attr('y', function(d, i) { 
                            let y = i >= landCover_names.length ? y_scale(landCover_names[i - landCover_names.length]) : y_scale(landCover_names[i])
                            return y + (y_scale.bandwidth() * 0.1);
                        })
                        .attr('height', y_scale.bandwidth() * 0.8)
                        .attr('width', function(d, i) { return i >= landCover_names.length ? (900 - x_scale(landCover_values[i - landCover_names.length])) : x_scale(landCover_values[i])})
                        .attr('fill', function(d, i) { return i >= landCover_names.length ? 'white' : legendColors[i]})
                    .on("mouseover", function(d, i) {
                        let landcover_name = i >= landCover_names.length ? landCover_names[i - landCover_names.length] : landCover_names[i];
                        let areaBurnt = i >= landCover_names.length ? landCover_values[i - landCover_names.length] : landCover_values[i];

                        tooltip.style('opacity', 1)
                            .style("left",(d3.event.pageX)+"px")
                            .style("top",(d3.event.pageY)+"px")
                            .html(function () {
                                return "Landcover: "+landcover_name +"<br>Area burnt: " + (areaBurnt/1000000).toFixed(2) +" million ha (hectare)";
                            });
                    })
                    .on("mouseout", function(d, i) {
                        tooltip.style('opacity', 0);
                    });

                //Draw Axises for chart
                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(35,100)')
                    .call(d3.axisLeft(y_scale).tickFormat(''));

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(35,600)')
                    .call(d3.axisBottom(x_scale).ticks(5).tickFormat(d3.format("~s")));

                //Draw Axis title for chart
                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(20, 375)')
                    .append('text')
                        .attr('transform','rotate(-90)')
                        .attr("text-anchor", "start")
                        .text("LandCovers");

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(335, 640)')
                    .append('text')
                        .attr("text-anchor", "start")
                        .text("LandCover Area Burnt by ha (Hectare)");

                //Draw legend for chart
                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('id', 'legend')
                        .attr('transform','translate(960, 100)')
                    .selectAll('circle')
                    .data(legendColors)
                    .enter()
                    .append('circle')
                        .attr('cx', function(d, i) { return 0 })
                        .attr('cy', function(d, i) { return 25 * i })
                        .attr('fill', function(d,i) { return d })
                        .attr('r', 5);

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('id', 'legend')
                        .attr('transform','translate(945, 105)')
                    .selectAll('text')
                    .data(landCover_names)
                    .enter()
                    .append('text')
                        .attr("text-anchor", "end")
                        .attr('x', function(d, i) { return 0 })
                        .attr('y', function(d, i) { return 25 * i })
                        .text(function(d) { return d; });

                //Draw annotations last or else it bugs everything else
                const annotations = [
                    {
                        note: {
                            title: "Legend",
                            label: "Each color represent a type of landcover",
                        },
                        type: d3.annotationCalloutRect,
                        color:['black'],
                        subject: {
                            width: 200,
                            height: 150
                        },
                        x: 785,
                        y: 75,
                        dy: 175,
                        dx: -50
                    },
                    {
                        note: {
                            title: "Croplands",
                            label: "Areas of and used to grow crops",
                        },
                        color:['black'],
                        x: x_scale(year_data[year]['Croplands']) + 35,
                        y: 150,
                        dy: -1,
                        dx: 50
                    },
                    {
                        note: {
                            title: "Forests",
                            label: "Areas of dense trees",
                        },
                        color:['black'],
                        x: x_scale(year_data[year]['Forests']) + 35,
                        y: 250,
                        dy: -1,
                        dx: 50
                    },
                    {
                        note: {
                            title: "Others",
                            label: "Areas of excluded landcovers",
                        },
                        color:['black'],
                        x: x_scale(year_data[year]['Others']) + 35,
                        y: 350,
                        dy: -1,
                        dx: 50
                    },
                    {
                        note: {
                            title: "Savannas",
                            label: "Areas of mix woodland and grassland",
                        },
                        color:['black'],
                        x: x_scale(year_data[year]['Savannas']) + 35,
                        y: 450,
                        dy: -1,
                        dx: 20
                    },
                    {
                        note: {
                            title: "Shrublands/Grasslands",
                            label: "Areas of dense shrubs, short trees, and grass",
                        },
                        color:['black'],
                        x: x_scale(year_data[year]['Shrublands/Grasslands']) + 35,
                        y: 550,
                        dy: -50,
                        dx: -10
                    }
                ]
                
                drawAnnotations(annotations, chartNumber);
            }
            async function drawLandCoverChart1(year, chartNumber)
            {
                console.log('drawLandCoverChart for chart '+chartNumber)
                const legendColors = ['red','yellow','blue','green','magenta']

                let data = await loadData();

                let year_data = data[0];
                let country_data = data[1];

                let landCover_names = [];
                let landCover_values = [];
                for (const [landcover, landcover_value] of Object.entries(year_data[year]))
                {
                    landCover_names.push(landcover);
                    landCover_values.push(landcover_value);
                }
                //Add twice the # of items in array with fake values for tooltip hover (Using landCover_values)
                for (let i = 0; i < landCover_names.length; i++)
                {
                    landCover_values.push(0)
                }

                let x_scale = d3.scaleLinear().domain([Math.min(...landCover_values), Math.max(...landCover_values)]).range([0, 900]);
                let y_scale = d3.scaleBand().domain(landCover_names).range([0, 500]);

                let tooltip = d3.select('#tooltip');

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(35,100)')
                    .selectAll('rect')
                    .data(landCover_values)
                    .enter()
                    .append('rect')
                        .attr('id', 'landCover_rectangle')
                        .attr('x', function(d, i) { return i >= landCover_names.length ? x_scale(landCover_values[i - landCover_names.length]) : 0})
                        .attr('y', function(d, i) { 
                            let y = i >= landCover_names.length ? y_scale(landCover_names[i - landCover_names.length]) : y_scale(landCover_names[i])
                            return y + (y_scale.bandwidth() * 0.1);
                        })
                        .attr('height', y_scale.bandwidth() * 0.8)
                        .attr('width', function(d, i) { return i >= landCover_names.length ? (900 - x_scale(landCover_values[i - landCover_names.length])) : x_scale(landCover_values[i])})
                        .attr('fill', function(d, i) { return i >= landCover_names.length ? 'white' : legendColors[i]})
                    .on("mouseover", function(d, i) {
                        let landcover_name = i >= landCover_names.length ? landCover_names[i - landCover_names.length] : landCover_names[i];
                        let areaBurnt = i >= landCover_names.length ? landCover_values[i - landCover_names.length] : landCover_values[i];

                        tooltip.style('opacity', 1)
                            .style("left",(d3.event.pageX)+"px")
                            .style("top",(d3.event.pageY)+"px")
                            .html(function () {
                                return "Landcover: "+landcover_name +"<br>Area burnt: " + (areaBurnt/1000000).toFixed(2) +" million ha (hectare)";
                            });
                    })
                    .on("mouseout", function(d, i) {
                        tooltip.style('opacity', 0);
                    });

                //Draw Axises for chart
                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(35,100)')
                    .call(d3.axisLeft(y_scale).tickFormat(''));

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(35,600)')
                    .call(d3.axisBottom(x_scale).ticks(5).tickFormat(d3.format("~s")));

                //Draw Axis title for chart
                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(20, 375)')
                    .append('text')
                        .attr('transform','rotate(-90)')
                        .attr("text-anchor", "start")
                        .text("LandCovers");

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(335, 640)')
                    .append('text')
                        .attr("text-anchor", "start")
                        .text("LandCover Area Burnt by ha (Hectare)");

                //Draw legend for chart
                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('id', 'legend')
                        .attr('transform','translate(960, 100)')
                    .selectAll('circle')
                    .data(legendColors)
                    .enter()
                    .append('circle')
                        .attr('cx', function(d, i) { return 0 })
                        .attr('cy', function(d, i) { return 25 * i })
                        .attr('fill', function(d,i) { return d })
                        .attr('r', 5);

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('id', 'legend')
                        .attr('transform','translate(945, 105)')
                    .selectAll('text')
                    .data(landCover_names)
                    .enter()
                    .append('text')
                        .attr("text-anchor", "end")
                        .attr('x', function(d, i) { return 0 })
                        .attr('y', function(d, i) { return 25 * i })
                        .text(function(d) { return d; });

                //Draw annotations last or else it bugs everything else
                const annotations = [
                    {
                        note: {
                            title: "Croplands",
                            label: "1.47x More Land Burnt than Forests",
                        },
                        color:['black'],
                        x: x_scale(year_data[year]['Croplands']) + 35,
                        y: 150,
                        dy: -1,
                        dx: 50
                    },
                    {
                        note: {
                            title: "Savannas",
                            label: "6.50x More Land Burnt than Forests",
                        },
                        color:['black'],
                        x: x_scale(year_data[year]['Savannas']) + 35,
                        y: 450,
                        dy: -1,
                        dx: 20
                    },
                    {
                        note: {
                            title: "Shrublands/Grasslands",
                            label: "9.94x More Land Burnt than Forests",
                        },
                        color:['black'],
                        x: x_scale(year_data[year]['Shrublands/Grasslands']) + 35,
                        y: 550,
                        dy: -50,
                        dx: -1
                    }
                ]
                
                drawAnnotations(annotations, chartNumber);
            }
            async function drawLandCoverChart2(year, chartNumber)
            {
                console.log('drawLandCoverChart for chart '+chartNumber)
                const legendColors = ['red','yellow','blue','green','magenta']

                let data = await loadData();

                let year_data = data[0];
                let country_data = data[1];

                let landCover_names = [];
                let landCover_values = [];
                for (const [landcover, landcover_value] of Object.entries(year_data[year]))
                {
                    landCover_names.push(landcover);
                    landCover_values.push(landcover_value);
                }
                //Add twice the # of items in array with fake values for tooltip hover (Using landCover_values)
                for (let i = 0; i < landCover_names.length; i++)
                {
                    landCover_values.push(0)
                }

                let x_scale = d3.scaleLinear().domain([Math.min(...landCover_values), Math.max(...landCover_values)]).range([0, 900]);
                let y_scale = d3.scaleBand().domain(landCover_names).range([0, 500]);

                let tooltip = d3.select('#tooltip');

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(35,100)')
                    .selectAll('rect')
                    .data(landCover_values)
                    .enter()
                    .append('rect')
                        .attr('id', 'landCover_rectangle')
                        .attr('x', function(d, i) { return i >= landCover_names.length ? x_scale(landCover_values[i - landCover_names.length]) : 0})
                        .attr('y', function(d, i) { 
                            let y = i >= landCover_names.length ? y_scale(landCover_names[i - landCover_names.length]) : y_scale(landCover_names[i])
                            return y + (y_scale.bandwidth() * 0.1);
                        })
                        .attr('height', y_scale.bandwidth() * 0.8)
                        .attr('width', function(d, i) { return i >= landCover_names.length ? (900 - x_scale(landCover_values[i - landCover_names.length])) : x_scale(landCover_values[i])})
                        .attr('fill', function(d, i) { return i >= landCover_names.length ? 'white' : legendColors[i]})
                    .on("mouseover", function(d, i) {
                        let landcover_name = i >= landCover_names.length ? landCover_names[i - landCover_names.length] : landCover_names[i];
                        let areaBurnt = i >= landCover_names.length ? landCover_values[i - landCover_names.length] : landCover_values[i];

                        tooltip.style('opacity', 1)
                            .style("left",(d3.event.pageX)+"px")
                            .style("top",(d3.event.pageY)+"px")
                            .html(function () {
                                return "Landcover: "+landcover_name +"<br>Area burnt: " + (areaBurnt/1000000).toFixed(2) +" million ha (hectare)";
                            });
                    })
                    .on("mouseout", function(d, i) {
                        tooltip.style('opacity', 0);
                    });

                //Draw Axises for chart
                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(35,100)')
                    .call(d3.axisLeft(y_scale).tickFormat(''));

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(35,600)')
                    .call(d3.axisBottom(x_scale).ticks(5).tickFormat(d3.format("~s")));

                //Draw Axis title for chart
                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(20, 375)')
                    .append('text')
                        .attr('transform','rotate(-90)')
                        .attr("text-anchor", "start")
                        .text("LandCovers");

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(335, 640)')
                    .append('text')
                        .attr("text-anchor", "start")
                        .text("LandCover Area Burnt by ha (Hectare)");

                //Draw legend for chart
                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('id', 'legend')
                        .attr('transform','translate(960, 100)')
                    .selectAll('circle')
                    .data(legendColors)
                    .enter()
                    .append('circle')
                        .attr('cx', function(d, i) { return 0 })
                        .attr('cy', function(d, i) { return 25 * i })
                        .attr('fill', function(d,i) { return d })
                        .attr('r', 5);

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('id', 'legend')
                        .attr('transform','translate(945, 105)')
                    .selectAll('text')
                    .data(landCover_names)
                    .enter()
                    .append('text')
                        .attr("text-anchor", "end")
                        .attr('x', function(d, i) { return 0 })
                        .attr('y', function(d, i) { return 25 * i })
                        .text(function(d) { return d; });

                //Draw annotations last or else it bugs everything else
                const annotations = [
                    {
                        note: {
                            title: "Forests",
                            label: "1.25x More Land Burnt than Croplands",
                        },
                        color:['black'],
                        x: x_scale(year_data[year]['Forests']) + 35,
                        y: 250,
                        dy: -1,
                        dx: 50
                    },
                ]
                
                drawAnnotations(annotations, chartNumber);
            }
            async function drawLandCoverChart3(year, chartNumber)
            {
                console.log('drawLandCoverChart for chart '+chartNumber)
                const legendColors = ['red','yellow','blue','green','magenta']

                let data = await loadData();

                let year_data = data[0];
                let country_data = data[1];

                let landCover_names = [];
                let landCover_values = [];
                for (const [landcover, landcover_value] of Object.entries(year_data[year]))
                {
                    landCover_names.push(landcover);
                    landCover_values.push(landcover_value);
                }
                //Add twice the # of items in array with fake values for tooltip hover (Using landCover_values)
                for (let i = 0; i < landCover_names.length; i++)
                {
                    landCover_values.push(0)
                }

                let x_scale = d3.scaleLinear().domain([Math.min(...landCover_values), Math.max(...landCover_values)]).range([0, 900]);
                let y_scale = d3.scaleBand().domain(landCover_names).range([0, 500]);

                let tooltip = d3.select('#tooltip');

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(35,100)')
                    .selectAll('rect')
                    .data(landCover_values)
                    .enter()
                    .append('rect')
                        .attr('id', 'landCover_rectangle')
                        .attr('x', function(d, i) { return i >= landCover_names.length ? x_scale(landCover_values[i - landCover_names.length]) : 0})
                        .attr('y', function(d, i) { 
                            let y = i >= landCover_names.length ? y_scale(landCover_names[i - landCover_names.length]) : y_scale(landCover_names[i])
                            return y + (y_scale.bandwidth() * 0.1);
                        })
                        .attr('height', y_scale.bandwidth() * 0.8)
                        .attr('width', function(d, i) { return i >= landCover_names.length ? (900 - x_scale(landCover_values[i - landCover_names.length])) : x_scale(landCover_values[i])})
                        .attr('fill', function(d, i) { return i >= landCover_names.length ? 'white' : legendColors[i]})
                    .on("mouseover", function(d, i) {
                        let landcover_name = i >= landCover_names.length ? landCover_names[i - landCover_names.length] : landCover_names[i];
                        let areaBurnt = i >= landCover_names.length ? landCover_values[i - landCover_names.length] : landCover_values[i];

                        tooltip.style('opacity', 1)
                            .style("left",(d3.event.pageX)+"px")
                            .style("top",(d3.event.pageY)+"px")
                            .html(function () {
                                return "Landcover: "+landcover_name +"<br>Area burnt: " + (areaBurnt/1000000).toFixed(2) +" million ha (hectare)";
                            });
                    })
                    .on("mouseout", function(d, i) {
                        tooltip.style('opacity', 0);
                    });

                //Draw Axises for chart
                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(35,100)')
                    .call(d3.axisLeft(y_scale).tickFormat(''));

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(35,600)')
                    .call(d3.axisBottom(x_scale).ticks(5).tickFormat(d3.format("~s")));

                //Draw Axis title for chart
                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(20, 375)')
                    .append('text')
                        .attr('transform','rotate(-90)')
                        .attr("text-anchor", "start")
                        .text("LandCovers");

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('transform','translate(335, 640)')
                    .append('text')
                        .attr("text-anchor", "start")
                        .text("LandCover Area Burnt by ha (Hectare)");

                //Draw legend for chart
                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('id', 'legend')
                        .attr('transform','translate(960, 100)')
                    .selectAll('circle')
                    .data(legendColors)
                    .enter()
                    .append('circle')
                        .attr('cx', function(d, i) { return 0 })
                        .attr('cy', function(d, i) { return 25 * i })
                        .attr('fill', function(d,i) { return d })
                        .attr('r', 5);

                d3.select('#landCoverChart'+chartNumber)
                    .append('g')
                        .attr('id', 'legend')
                        .attr('transform','translate(945, 105)')
                    .selectAll('text')
                    .data(landCover_names)
                    .enter()
                    .append('text')
                        .attr("text-anchor", "end")
                        .attr('x', function(d, i) { return 0 })
                        .attr('y', function(d, i) { return 25 * i })
                        .text(function(d) { return d; });

                //Draw annotations last or else it bugs everything else
                const annotations = [
                    {
                        note: {
                            title: "Savannas",
                            label: "1.05x More Land Burnt than Forests",
                        },
                        color:['black'],
                        x: x_scale(year_data[year]['Savannas']) + 35,
                        y: 450,
                        dy: -1,
                        dx: 20
                    },
                ]
                
                drawAnnotations(annotations, chartNumber);
            }
            function calculateAnnotations(year_data, x_scale, year)
            {
                console.log('calculateAnnotations')

                //No previous year data on 2002 so return nothing
                if (year == 2002)
                    return [];

                let prev_year_data = year_data[year-1];
                let curr_year_data = year_data[year];
                
                let landcover_ratio = [];
                landcover_ratio[0] = (curr_year_data['Croplands'] / prev_year_data['Croplands'] * 100) - 100;
                landcover_ratio[1] = (curr_year_data['Forests'] / prev_year_data['Forests'] * 100) - 100;
                landcover_ratio[2] = (curr_year_data['Others'] / prev_year_data['Others'] * 100) - 100;
                landcover_ratio[3] = (curr_year_data['Savannas'] / prev_year_data['Savannas'] * 100) - 100;
                landcover_ratio[4] = (curr_year_data['Shrublands/Grasslands'] / prev_year_data['Shrublands/Grasslands'] * 100) - 100;

                let landcover_index_max = landcover_ratio.indexOf(Math.max(...landcover_ratio))
                let landcover_index_min = landcover_ratio.indexOf(Math.min(...landcover_ratio))

                const annotation_bodies = [
                    {
                        note: {
                            title: landcover_index_min == 0 ? 'Least Multiple Diff From Prev Year' : 'Greatest Multiple Diff From Prev Year',
                            label: "Croplands " + (landcover_ratio[0] > 0 ? 'increased' : 'decreased') + " by " + landcover_ratio[0].toFixed(2) +"x",
                        },
                        color:['black'],
                        x: x_scale(curr_year_data['Croplands']) + 35,
                        y: 150,
                        dy: -1,
                        dx: 50
                    },
                    {
                        note: {
                            title: landcover_index_min == 1 ? 'Least Multiple Diff From Prev Year' : 'Greatest Multiple Diff From Prev Year',
                            label: "Forests " + (landcover_ratio[1] > 0 ? 'increased' : 'decreased') + " by " + landcover_ratio[1].toFixed(2) +"x",
                        },
                        color:['black'],
                        x: x_scale(curr_year_data['Forests']) + 35,
                        y: 250,
                        dy: -1,
                        dx: 50
                    },
                    {
                        note: {
                            title: landcover_index_min == 2 ? 'Least Multiple Diff From Prev Year' : 'Greatest Multiple Diff From Prev Year',
                            label: "Others " + (landcover_ratio[2] > 0 ? 'increased' : 'decreased') + " by " + landcover_ratio[2].toFixed(2) +"x",
                        },
                        color:['black'],
                        x: x_scale(curr_year_data['Others']) + 35,
                        y: 350,
                        dy: -1,
                        dx: 50
                    },
                    {
                        note: {
                            title: landcover_index_min == 3 ? 'Least Multiple Diff From Prev Year' : 'Greatest Multiple Diff From Prev Year',
                            label: "Savannas " + (landcover_ratio[3] > 0 ? 'increased' : 'decreased') + " by " + landcover_ratio[3].toFixed(2) +"x",
                        },
                        color:['black'],
                        x: x_scale(curr_year_data['Savannas']) + 35,
                        y: 450,
                        dy: -50,
                        dx: -50
                    },
                    {
                        note: {
                            title: landcover_index_min == 4 ? 'Least Multiple Difference From Prev Year' : 'Greatest Multiple Difference From Prev Year',
                            label: "Shrublands/Grasslands " + (landcover_ratio[4] > 0 ? 'increased' : 'decreased') + " by " + landcover_ratio[4].toFixed(2) +"x",
                        },
                        color:['black'],
                        x: x_scale(curr_year_data['Shrublands/Grasslands']) + 35,
                        y: 550,
                        dy: -1,
                        dx: 10
                    }
                ]

                //Return the annotations with the greatest and least percent change
                return [annotation_bodies[landcover_index_max], annotation_bodies[landcover_index_min]];
            }
            async function loadData() 
            {
                const annualBurnedAreaLandcoverPath = 'data/5-annual-burned-area-by-landcover.csv'
                const annualBurnedAreaLandcoverData = await d3.csv(annualBurnedAreaLandcoverPath)

                let year_data = {}

                let country_data = {}

                let curr_country = "";
                let country = "";
                let year = 0;

                let croplands_burnt = 0;
                let forests_burnt = 0;
                let others_categories_burnt = 0;
                let savannas_burnt = 0;
                let shurblands_grasslands_burnt = 0;

                for (row of annualBurnedAreaLandcoverData)
                {
                    croplands_burnt = parseInt(row['Yearly burned area across croplands']);
                    forests_burnt = parseInt(row['Yearly burned area across forests']);
                    others_categories_burnt = parseInt(row['Yearly burned area across other land categories']);
                    savannas_burnt = parseInt(row['Yearly burned area across savannas']);
                    shurblands_grasslands_burnt = parseInt(row['Yearly burned area across shrublands and grasslands']);

                    country = row['Entity'];
                    year = row['Year'];

                    if (year_data[year] == undefined)
                    {
                        year_data[year] = {};
                        year_data[year]['Croplands'] = 0;
                        year_data[year]['Forests'] = 0;
                        year_data[year]['Others'] = 0;
                        year_data[year]['Savannas'] = 0;
                        year_data[year]['Shrublands/Grasslands'] = 0;
                    }
                    if (country_data[year] == undefined)
                    {
                        //Add new year to list if doesn't exist 
                        country_data[year] = {};
                    }

                    //Add new country and its data points for each year
                    country_data[year][country] = {};
                    country_data[year][country]['Croplands'] = croplands_burnt;
                    country_data[year][country]['Forests'] = forests_burnt;
                    country_data[year][country]['Others'] = others_categories_burnt;
                    country_data[year][country]['Savannas'] = savannas_burnt;
                    country_data[year][country]['Shrublands/Grasslands'] = shurblands_grasslands_burnt;

                    //Add data point for 'all' category to be averaged
                    year_data[year]['Croplands'] += croplands_burnt;
                    year_data[year]['Forests'] += forests_burnt;
                    year_data[year]['Others'] += others_categories_burnt;
                    year_data[year]['Savannas'] += savannas_burnt;
                    year_data[year]['Shrublands/Grasslands'] += shurblands_grasslands_burnt;
                
                }

                return [year_data, country_data]; 
            }