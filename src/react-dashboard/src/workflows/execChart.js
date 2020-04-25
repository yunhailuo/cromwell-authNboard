import * as d3 from 'd3';
import React, { useState } from 'react';
import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';

// https://css-tricks.com/scale-svg/
const useStyles = makeStyles((theme) => ({
    chartContainer: {
        borderColor: theme.palette.divider,
        borderStyle: 'solid',
        borderWidth: 1,
        position: 'relative',
        height: 0,
        width: '100%',
    },
    chart: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        left: 0,
        top: 0,
    },
}));

// Adapted from d3-axis
const Axis = ({ scale, orient = 'top' }) => {
    const values = scale.ticks ? scale.ticks() : scale.domain();
    const tickSign = orient == 'top' ? -1 : 1;
    const range = scale.range();
    const range0 = +range[0] + 0.5;
    const range1 = +range[range.length - 1] + 0.5;
    const transform = (data) => `translate(${scale(data) + 0.5}, 0)`;

    return (
        <g
            style={{
                textAnchor: 'middle',
            }}
        >
            <path
                d={[
                    'M',
                    range0,
                    tickSign * 6,
                    'V0.5H',
                    range1,
                    'V',
                    tickSign * 6,
                ].join(' ')}
                fill="none"
                stroke="currentColor"
            />
            {values.map((value) => (
                <g key={value} transform={transform(value)}>
                    <line y2={tickSign * 6} stroke="currentColor" />
                    <text
                        fill="currentColor"
                        y={tickSign * 9}
                        dy={
                            orient === 'top'
                                ? '0em'
                                : orient === 'bottom'
                                    ? '0.71em'
                                    : '0.32em'
                        }
                    >
                        {scale.tickFormat ? scale.tickFormat()(value) : value}
                    </text>
                </g>
            ))}
        </g>
    );
};
Axis.propTypes = {
    scale: PropTypes.func.isRequired,
    orient: PropTypes.oneOf(['top', 'bottom']),
};

const HighlightableStrip = ({ isFilled, ...otherAttrs }) => {
    const [highlight, setHighlight] = useState(false);
    const handleMouseOver = () => {
        setHighlight(true);
    };
    const handleMouseLeave = () => {
        setHighlight(false);
    };
    return (
        <rect
            fill={
                highlight
                    ? '#7986cb'
                    : isFilled
                        ? '#e2e2e2'
                        : 'rgba(0, 0, 0, 0)'
            }
            {...otherAttrs}
            onMouseOver={handleMouseOver}
            onMouseLeave={handleMouseLeave}
        />
    );
};
HighlightableStrip.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    isFilled: PropTypes.bool.isRequired,
};

export const ExecutionChart = ({ workflowCalls, width = 1200 }) => {
    const classes = useStyles();

    // workflowCalls = [
    //     {
    //         start,
    //         end,
    //         calls: [
    //             {
    //                 start,
    //                 end,
    //                 callName,
    //                 shards: [[shardIndex, events], ...]
    //             },
    //             ...
    //         ]
    //     }
    // ]

    const cumShardCount = workflowCalls.calls.map(
        ((cumSum) => (call) => (cumSum += call.shards.length))(0),
    );
    const maxCallNameLength = Math.max.apply(
        null,
        workflowCalls.calls.map((call) => call.callName.length),
    );
    // add 2 characters for shard index
    const labelWidth = (maxCallNameLength + 2) * 7.5;
    // Leave 30px space for top and bottom axes
    const height = cumShardCount[cumShardCount.length - 1] * 25 + 30 + 30;
    const plotSize = {
        width: width - 30 - labelWidth - 30,
        height: height - 30 - 30,
        marginLeft: 30 + labelWidth,
        marginTop: 30,
    };
    const x = d3
        .scaleLinear()
        .domain([workflowCalls.start, workflowCalls.end])
        .range([0, plotSize.width]);
    const y = d3
        .scaleBand()
        .domain(d3.range(cumShardCount[cumShardCount.length - 1]))
        .range([0, plotSize.height])
        .padding(0.4);
    const axisScale = d3
        .scaleTime()
        .domain([new Date(workflowCalls.start), new Date(workflowCalls.end)])
        .range([0, plotSize.width])
        .nice();

    return (
        <Box
            padding={0}
            paddingBottom={`${(height / width) * 100}%`}
            className={classes.chartContainer}
        >
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className={classes.chart}
            >
                <g
                    transform={`translate(${plotSize.marginLeft} ${plotSize.marginTop})`}
                >
                    <Axis scale={axisScale} orient="top" />
                </g>
                <g
                    transform={`translate(${plotSize.marginLeft} ${plotSize.marginTop})`}
                >
                    {workflowCalls.calls.map((call, i) => (
                        <g key={call.callName}>
                            {call.shards.map(([shardIndex, events], j) => (
                                <g
                                    key={j}
                                    transform={`translate(0 ${y(
                                        (cumShardCount[i - 1] || 0) + j,
                                    )})`}
                                >
                                    <text
                                        x={-10}
                                        y={0}
                                        fill="black"
                                        dominantBaseline="hanging"
                                        textAnchor="end"
                                    >
                                        {call.callName}
                                        {call.shards.length > 1
                                            ? `.${shardIndex}`
                                            : null}
                                    </text>
                                    <g
                                        transform={`translate(0, ${-(
                                            y.step() * y.padding()
                                        ) / 2})`}
                                    >
                                        <HighlightableStrip
                                            x={0}
                                            height={y.step()}
                                            width={plotSize.width}
                                            isFilled={i % 2 === 0}
                                        />
                                    </g>
                                    {events.map((event, k) => (
                                        <rect
                                            key={k}
                                            x={x(event.start)}
                                            height={y.bandwidth()}
                                            width={
                                                x(event.end) - x(event.start)
                                            }
                                            fill={d3.interpolateRainbow(
                                                k / (events.length - 1),
                                            )}
                                        />
                                    ))}
                                </g>
                            ))}
                        </g>
                    ))}
                </g>
                <g
                    transform={`translate(${
                        plotSize.marginLeft
                    } ${plotSize.marginTop + plotSize.height})`}
                >
                    <Axis scale={axisScale} orient="bottom" />
                </g>
            </svg>
        </Box>
    );
};
ExecutionChart.propTypes = {
    workflowCalls: PropTypes.shape({
        start: PropTypes.number.isRequired,
        end: PropTypes.number.isRequired,
        calls: PropTypes.arrayOf(
            PropTypes.shape({
                start: PropTypes.number.isRequired,
                end: PropTypes.number.isRequired,
                shards: PropTypes.arrayOf(PropTypes.array).isRequired,
            }),
        ).isRequired,
    }).isRequired,
    width: PropTypes.number,
};
