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
    const barChartData = prepareBarChartData(loansClean).sort((a,b) => {
        return d3.descending(a.CurrentBalance, b.CurrentBalance);
    })
    console.log("barChartData2")
    console.log(barChartData)

    //Margin Convestion
    const margin = {top:100, right:40, bottom:40, left:125};
    const width = 600 - margin.left - margin.right;
    const height = 750 - margin.top - margin.bottom;

    //Scales
    const xMax = d3.max(barChartData, d => d.CurrentBalance);

    const xScale = d3
        .scaleLinear([0, xMax], [0, width] )

    const yScale = d3
        .scaleBand()
        .domain(barChartData.map(d => d.LoanPurpose))
        .rangeRound([0, height])
        .paddingInner(0.25)

    //Draw Base, here you are creating the SVG that is within the total chart area
    const svg = d3.select('.bar-chart-container')
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
 

    header.append('tspan').text('Total Current Balance by Loan Purpose') //Headline
    
    
    header
        .append('tspan')
        .text('STACR2017DNA3 as of 9/1/2019') 
        .attr('x', 0)
        .attr('dy', '1.5em')
        .style('font-size', '0.8em')
        .style('fill', '#555')         //Subline


    //Draw bars, here you are binding the data to the elements which will then be transformed visually
    const bars = svg 
        .selectAll('.bar') //This is a nonexisting element and d3 creates placeholders for it and joins it to the data
        .data(barChartData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('y', d => yScale(d.LoanPurpose))
        .attr('width', d => xScale(d.CurrentBalance))
        .attr('height', yScale.bandwidth)
        .style('fill', 'dodgerblue')

    //Draw Axes
    const xAxis = d3
        .axisTop(xScale)
        .tickFormat(formatTicks)
        .tickSizeInner(-height)
        .tickSizeOuter(0);

    const xAxisDraw = svg
        .append('g')
        .attr('class', 'x axis')
        .call(xAxis);

    const yAxis = d3
        .axisLeft(yScale)
        .tickSize(0)

    const yAxisDraw = svg
        .append('g')
        .attr('class', 'y axis')
        .call(yAxis)

    yAxisDraw.selectAll('text').attr('dx', '-0.6em');
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