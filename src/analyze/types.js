/**
 * @typedef {Object} AnalysisMetadata
 * @property {Array<Object>} [traits]
 * @property {Array<Object>} [products]
 * @property {Array<Object>} [legislations]
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {string} [summary]
 * @property {string} [product_type]
 * @property {string} [product_match_confidence]
 * @property {string} [product_match_stage]
 * @property {string} [overall_risk]
 * @property {Array<Object>} [standard_sections]
 * @property {Array<Object>} [legislation_sections]
 * @property {Array<Object>} [missing_information_items]
 * @property {Array<Object>} [suggested_quick_adds]
 * @property {Array<string>} [all_traits]
 * @property {Object} [confidence_panel]
 * @property {Object} [hero_summary]
 */

/**
 * @typedef {Object} ClarificationItem
 * @property {string} key
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [importance]
 * @property {string[]} [choices]
 */

/**
 * @typedef {Object} MissingInput
 * @property {string} key
 * @property {string} title
 * @property {string} severity
 * @property {string} reason
 * @property {string[]} examples
 */

/**
 * @typedef {Object} EvidenceNeed
 * @property {string} key
 * @property {string} label
 * @property {string[]} typicalEvidence
 * @property {string[]} commonMissing
 * @property {string[]} blockers
 */

/**
 * @typedef {Object} AnalysisViewModel
 * @property {{ type: string, family: string, subtype: string, stage: string, summary: string }} productIdentity
 * @property {Array<Object>} routeSections
 * @property {Array<ClarificationItem>} guidanceItems
 * @property {Array<Object>} legislationItems
 * @property {Array<Object>} legislationGroups
 * @property {Array<Object>} directiveBreakdown
 * @property {Object | null} baseSafetyRoute
 * @property {number} totalStandards
 * @property {string[]} triggeredDirectives
 * @property {Array<{label: string, text: string}> | null} backendChips
 * @property {Array<string>} assumptions
 * @property {{ label: string, tone: string }} resultMaturity
 * @property {{ label: string, tone: string }} classificationConfidence
 * @property {MissingInput[]} missingInputs
 * @property {EvidenceNeed[]} evidenceNeeds
 * @property {Array<Object>} primaryRouteSections
 * @property {Array<Object>} secondaryRouteSections
 * @property {Array<Object>} conditionalRouteSections
 * @property {Array<Object>} primaryLegislationGroups
 * @property {Array<Object>} conditionalLegislationGroups
 * @property {Array<Object>} peripheralLegislationGroups
 * @property {Object | null} primaryRoute
 * @property {Array<Object>} secondaryRoutes
 * @property {{ core: Array<Object>, conditional: Array<Object>, peripheral: Array<Object> }} standardGroups
 * @property {Array<Object>} warnings
 * @property {{ status: string, count: number }} clarificationState
 * @property {{ primaryRouteLabel: string, blockerCount: number, routeAffectingCount: number, clarificationCount: number, directiveCount: number }} decisionSignals
 */

export {};
