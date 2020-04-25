import * as d3 from 'd3';
import React, { useMemo, useState } from 'react';
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

const AxisTop = ({ domain = [0, 100], range = [10, 290], ...otherAttrs }) => {
    const ticks = useMemo(() => {
        const xScale = d3
            .scaleLinear()
            .domain(domain)
            .range(range);

        const width = range[1] - range[0];
        const pixelsPerTick = 50;
        const numberOfTicksTarget = Math.max(
            1,
            Math.floor(width / pixelsPerTick),
        );

        return xScale.ticks(numberOfTicksTarget).map((value) => ({
            value,
            xOffset: xScale(value),
        }));
    }, [domain, range]);

    return (
        <g transform="translate(30 0)" {...otherAttrs}>
            <path
                d={['M', range[0], 25, 'v', 6, 'H', range[1], 'v', -6].join(
                    ' ',
                )}
                fill="none"
                stroke="currentColor"
            />
            {ticks.map(({ value, xOffset }) => (
                <g key={value} transform={`translate(${xOffset}, 0)`}>
                    <line y1="25" y2="31" stroke="currentColor" />
                    <text
                        key={value}
                        style={{
                            fontSize: '10px',
                            textAnchor: 'middle',
                            transform: 'translateY(20px)',
                        }}
                    >
                        {new Date(value).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </text>
                </g>
            ))}
        </g>
    );
};
AxisTop.propTypes = {
    domain: PropTypes.arrayOf(PropTypes.number),
    range: PropTypes.arrayOf(PropTypes.number),
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

export const ExecutionChart = ({ workflowCalls, width = 1000 }) => {
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
                <AxisTop
                    domain={[workflowCalls.start, workflowCalls.end]}
                    range={[0, plotSize.width]}
                    transform={`translate(${plotSize.marginLeft} 0)`}
                />

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
