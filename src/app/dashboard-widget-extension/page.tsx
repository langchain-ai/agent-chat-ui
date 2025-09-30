"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Tables } from "@/lib/database.types"; // <-- 1. Import the Tables helper
import { mdiGamepadCircleOutline } from "@mdi/js";

// Import Chakra UI components
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Badge,
    Box,
    Heading,
    Text,
    Center,
    CircularProgress,
    Icon,
    HStack,
} from "@chakra-ui/react";

// 2. Define our component's type using the generated types.
// This is more robust than a manual type.
type Recommendation = Tables<'recommendations'> & {
    kpi_performance: Tables<'kpi_performance'>[];
};

function DashboardWidget() {
    // 3. Use the new, more accurate type for our state
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('recommendations')
                .select(`*, kpi_performance(*)`);

            if (error) {
                setFetchError("Could not fetch the recommendations data.");
                setRecommendations([]);
            } else if (data) {
                // 4. No more `as Recommendation[]` needed!
                // The 'data' variable is already fully typed.
                setRecommendations(data);
                setFetchError(null);
            }
            setLoading(false);
        };
        fetchRecommendations();
    }, []);

    const getBadgeColorScheme = (status: Recommendation['status']) => {
        switch (status) {
            case 'implemented':
                return 'green';
            case 'pending_implementation':
                return 'orange';
            case 'blocked':
                return 'red';
            default:
                return 'gray';
        }
    };

    return (
        <Box p={5}>
            <HStack>
                <Icon layerStyle="icon.subtle" boxSize="icon.md" color="blue">
                    <path d={mdiGamepadCircleOutline} />
                </Icon>
                <Heading as="h1" size="lg" mb={4}>
                    Brand Recommendations
                </Heading>
            </HStack>
            {fetchError && <Text color="red.500">{fetchError}</Text>}

            <TableContainer>
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            <Th>Action Title</Th>
                            <Th>Status</Th>
                            <Th>Performance</Th>
                            <Th>Notes</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {loading ? (
                            <Tr><Td colSpan={4}><Center p={4}><CircularProgress
                                isIndeterminate
                                capIsRound
                                color="primary"
                                trackColor="neutral-color.200"
                            />
                            </Center></Td></Tr>
                        ) : recommendations.length > 0 ? (
                            recommendations.map((rec) => (
                                <Tr key={rec.recommendation_id}>
                                    <Td>{rec.action_title}</Td>
                                    <Td>
                                        <Badge colorScheme={getBadgeColorScheme(rec.status)}>
                                            {rec.status?.replace(/_/g, ' ') || 'No Status'}
                                        </Badge>
                                    </Td>
                                    <Td>{rec.kpi_performance[0]?.performance_value || 'N/A'}</Td>
                                    <Td>{rec.kpi_performance[0]?.notes || ''}</Td>
                                </Tr>
                            ))
                        ) : (
                            <Tr><Td colSpan={4}><Center p={4}><Text>No recommendations found.</Text></Center></Td></Tr>
                        )}
                    </Tbody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default DashboardWidget;