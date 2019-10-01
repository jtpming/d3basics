//import { func } from "prop-types";

//Data Prep
function filterData(data){
    return data.filter(d => {
        return d.LoanPurpose && d.OriginalFICO && d.CurrentBalance > 0 
        && d.PropertyState && d.OccupancyType
    })
}

function prepareBarChartData(data){
    const dataMap = d3.rollup(
        data,
        v => d3.sum(v, leaf => leaf.CurrentBalance),
        d => d.LoanPurpose
    );

    const dataArray = Array.from(dataMap, d => ({LoanPurpose: d[0], CurrentBalance: d[1]}));
    

    return dataArray
}

function prepareScatterData(data){
    return data.sort((a,b) => b.OriginalFICO - a.OriginalFICO).filter((d,i) => i < 10000);
}


//Format Labels
    function formatTicks(d){
        return d3.format('~s')(d)
            .replace('M', 'mil')
            .replace('G', 'bil')
            .replace('T', 'tril');
}
//Main Functin
function ready(loans){
    const loansClean = filterData(loans)
    const scatterData = prepareScatterData(loansClean);
    const barChartData = prepareBarChartData(loansClean).sort((a,b) => {
        return d3.descending(a.CurrentBalance, b.CurrentBalance);
    })

    console.log("scatterData", scatterData)

    //Margin Convestion
    const margin = {top:100, right:40, bottom:40, left:125};
    const width = 750 - margin.left - margin.right;
    const height = 750 - margin.top - margin.bottom;

    //Scales Here for the xaxis we're setting the scale from 0 -> OFico
    const xExtent = d3
        .extent(scatterData, d => d.OriginalFICO)
        .map((d, i) => (i === 0 ? d * .95 : d * 1.05))


    const xScale = d3
        .scaleLinear()
        .domain(xExtent)
        .range([0, width])

    const yExtent = d3
        .extent(scatterData, d => d.CurrentBalance)
        .map((d, i) => (i === 0 ? d * .01 : d * 1.1))

    const yScale = d3 //Here for the y axis we're setting the scale from 0 -> Current balance, but because of how the origin for svg is in the top left, we have to map it backwards down to 0
        .scaleLinear()
        .domain(yExtent)
        .range([height, 0])

    //Draw Base, here you are creating the SVG that is within the total chart area
    const svg = d3.select('.scatter-plot-container')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    //Draw Header
    const header = svg
        .append('g')
        .attr('class', 'bar-header')
        .attr('transform', `translate(0, ${-margin.top /2})`)
        .append('text')
 

    header.append('tspan').text('Current Balance by O Fico') //Headline
    
    
    header
        .append('tspan')
        .text('STACR2017DNA3 as of 9/1/2019') 
        .attr('x', 0)
        .attr('dy', '1.5em')
        .style('font-size', '0.8em')
        .style('fill', '#555')         //Subline


    //Draw scatter, here you are binding the data to the elements which will then be transformed visually
    const scatter = svg
        .append('g')
        .attr('class', 'scatter-points')
        .selectAll('.scatter')
        .data(scatterData)
        .enter()
        .append('circle')
        .attr('class', 'scatter')
        .attr('cx', d => xScale(d.OriginalFICO))
        .attr('cy', d => yScale(d.CurrentBalance))
        .attr('r', 0.8)
        .style('fill', 'dodgerblue')
        .style('fill-opacity', 0.8)
        

    //Draw Axes
    //x Axis
    const xAxis = d3
    .axisBottom(xScale)
    .ticks(8)
    .tickSizeInner(-height)
    .tickSizeOuter(0);

    function addLabel(axis, label, x, y){
        axis
            .selectAll('.tick:last-of-type text')
            .clone()
            .text(label)
            .attr('x', x)
            .attr('y', y)
            .style('text-anchor', 'start')
            .style('font-weight', 'bold')
            .style('fill', '#555')
    }

    const xAxisDraw = svg
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis)
        .call(addLabel, 'O FICO', 25, 0)

    xAxisDraw.selectAll('text').attr('dy', '1em')

    //y Axis
    const yAxis = d3
    .axisLeft(yScale)
    .ticks(8)
    .tickFormat(formatTicks)
    .tickSizeInner(-height)
    .tickSizeOuter(0);

    const yAxisDraw = svg
        .append('g')
        .attr('class', 'y axis')
        ///.attr('transform', `translate(0, ${height})`)
        .call(yAxis)
        .call(addLabel, 'C BAL', -40, -25)

    //Event handlers for selected elements
    let selectedID;

    function mouseover(){
        selectedID = d3.select(this).data()[0].LoanID;
        d3.selectAll('.scatter')
            .filter(d => d.LoanID === selectedID)
            .transition()
            .attr('r', 10)
    }

    function mouseout(){
        selectedID = d3.select(this).data()[0].LoanID;
        d3.selectAll('.scatter')
            .filter(d => d.LoanID === selectedID)
            .transition()
            .attr('r', 0.8);
    }

    //Update selected elements
    function updateSelected(data){
        d3.select('.selected-body')
            .selectAll('.selected-element')
            .data(data, d => d.id)
            .join(
                enter => enter
                    .append('p')
                    .attr('class', 'selected-element')
                    .html(
                        d => `<span class="selected-title">${d.LoanID}</span>, ${formatTicks(d.CurrentBalance)}
                        <br>OFico: ${d.OriginalFICO} | CombinedLTV: ${d.CombinedLTV}` 
                    ),

                update => update,

                exit => exit.remove(),
            )
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);
    }

    function highlightSelected(data){
        const selectedIDs = data.map(d => d.LoanID);
        
        d3.selectAll('.scatter')
            .filter(d => selectedIDs.includes(d.LoanID))
            .style('fill', 'coral');

        d3.selectAll('.scatter')
            .filter(d => !selectedIDs.includes(d.LoanID))
            .style('fill', 'dodgerblue');
    }

    //Brush handler
    function brushed(){
        if (d3.event.selection){
            const [[x0, y0], [x1,y1]] = d3.event.selection
            const selected = scatterData.filter(
                d =>
                x0 <= xScale(d.OriginalFICO) && 
                xScale(d.OriginalFICO) < x1 &&
                y0 <= yScale(d.CurrentBalance) 
                && yScale(d.CurrentBalance) < y1
            )
            updateSelected(selected)
            highlightSelected(selected)
        } else {
            updateSelected([])
            highlightSelected([])
        }
    }

    //Prep seleted elements' container
    d3.select('.selected-container')
        .style('width', `${width + margin.left + margin.right}px`)
        .style('height', `${height + margin.top + margin.bottom}px`)


    //Add Brush
    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on('brush end', brushed)


    svg
        .append('g')
        .attr('class', 'brush')
        .call(brush);
    }

  

//Type conversion
function type(d){
    return{
        CombinedLTV: +d.CombinedLTV,
        CurrentBalance: +d.CurrentBalance,
        CurrentRate: +d.CurrentRate,
        EffectiveDate: d.EffectiveDate,
        LoanID: d.LoanID,
        LoanPurpose: d.LoanPurpose,
        OccupancyType: d.OccupancyType,
        OriginalBalance: +d.OriginalBalance,
        OriginalFICO: +d.OriginalFICO,
        OriginalLTV: +d.OriginalLTV,
        OriginalTerm: +d.OriginalTerm,
        PropertyCity: d.PropertyCity,
        PropertyState: d.PropertyState,
        PropertyType: d.PropertyType,
        PropertyZipCode: d.PropertyZipCode,
        SalePrice: +d.SalePrice
    }
}


//Load Data
d3.csv('data/Stacr2017DNA3.csv', type).then(res => {
    console.log(res)
    ready(res)
})