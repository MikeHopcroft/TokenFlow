# token-flow graph API

The token-flow graph API allows applications to systematically explore every possible tiling of the query text with tokens that correspond to potential matches with alias text. Before the graph API, token-flow would return only the highest scoring tiling.

`I want a convertable with blue metallic paint`
`[ADD_TO_ORDER] [QUANTIFIER:1] [CONVERTABLE] [CONJUNCTION] [PAINT_OPTION_BLUE]

`I want a paintbrush with blue metallic paint`
`[ADD_TO_ORDER] [QUANTIFIER:1] [PAINTBRUSH] [CONJUNCTION] [CAN_OF_BLUE_PAINT]

`I want a convertable with white wall tires`
`I want four alloy rims with white wall tires`

from the index. Given a set of aliases corresponding tokens, 