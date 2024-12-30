/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/pump.json`.
 */
export type Pump = {
    "address": "MeMEdUAwqdw25Kwdz32GR13Cm4XcX9bKZKkNiQekJkY",
    "metadata": {
      "name": "pump",
      "version": "0.1.0",
      "spec": "0.1.0",
      "description": "Created with Anchor"
    },
    "instructions": [
      {
        "name": "addMarketCap",
        "discriminator": [
          50,
          12,
          102,
          227,
          221,
          213,
          84,
          3
        ],
        "accounts": [
          {
            "name": "admin",
            "writable": true,
            "signer": true,
            "relations": [
              "global"
            ]
          },
          {
            "name": "global",
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    103,
                    108,
                    111,
                    98,
                    97,
                    108
                  ]
                }
              ]
            }
          },
          {
            "name": "marketCap",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    109,
                    97,
                    114,
                    107,
                    101,
                    116,
                    95,
                    99,
                    97,
                    112
                  ]
                },
                {
                  "kind": "arg",
                  "path": "index"
                }
              ]
            }
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          },
          {
            "name": "rent",
            "address": "SysvarRent111111111111111111111111111111111"
          }
        ],
        "args": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "totalSupply",
            "type": "u64"
          },
          {
            "name": "solReserves",
            "type": "u64"
          },
          {
            "name": "tokenReserves",
            "type": "u64"
          },
          {
            "name": "tokenLiquidity",
            "type": "u64"
          }
        ]
      },
      {
        "name": "buy",
        "discriminator": [
          102,
          6,
          61,
          18,
          1,
          218,
          235,
          234
        ],
        "accounts": [
          {
            "name": "user",
            "writable": true,
            "signer": true
          },
          {
            "name": "global",
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    103,
                    108,
                    111,
                    98,
                    97,
                    108
                  ]
                }
              ]
            }
          },
          {
            "name": "marketCap",
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    109,
                    97,
                    114,
                    107,
                    101,
                    116,
                    95,
                    99,
                    97,
                    112
                  ]
                },
                {
                  "kind": "arg",
                  "path": "marketCapIndex"
                }
              ]
            },
            "relations": [
              "bondingCurve"
            ]
          },
          {
            "name": "feeRecipient",
            "writable": true,
            "relations": [
              "global"
            ]
          },
          {
            "name": "mint",
            "writable": true
          },
          {
            "name": "bondingCurve",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    98,
                    111,
                    110,
                    100,
                    105,
                    110,
                    103,
                    95,
                    99,
                    117,
                    114,
                    118,
                    101
                  ]
                },
                {
                  "kind": "account",
                  "path": "mint"
                }
              ]
            }
          },
          {
            "name": "associatedBondingCurve",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "account",
                  "path": "bondingCurve"
                },
                {
                  "kind": "const",
                  "value": [
                    6,
                    221,
                    246,
                    225,
                    215,
                    101,
                    161,
                    147,
                    217,
                    203,
                    225,
                    70,
                    206,
                    235,
                    121,
                    172,
                    28,
                    180,
                    133,
                    237,
                    95,
                    91,
                    55,
                    145,
                    58,
                    140,
                    245,
                    133,
                    126,
                    255,
                    0,
                    169
                  ]
                },
                {
                  "kind": "account",
                  "path": "mint"
                }
              ],
              "program": {
                "kind": "const",
                "value": [
                  140,
                  151,
                  37,
                  143,
                  78,
                  36,
                  137,
                  241,
                  187,
                  61,
                  16,
                  41,
                  20,
                  142,
                  13,
                  131,
                  11,
                  90,
                  19,
                  153,
                  218,
                  255,
                  16,
                  132,
                  4,
                  142,
                  123,
                  216,
                  219,
                  233,
                  248,
                  89
                ]
              }
            }
          },
          {
            "name": "associatedUser",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "account",
                  "path": "user"
                },
                {
                  "kind": "const",
                  "value": [
                    6,
                    221,
                    246,
                    225,
                    215,
                    101,
                    161,
                    147,
                    217,
                    203,
                    225,
                    70,
                    206,
                    235,
                    121,
                    172,
                    28,
                    180,
                    133,
                    237,
                    95,
                    91,
                    55,
                    145,
                    58,
                    140,
                    245,
                    133,
                    126,
                    255,
                    0,
                    169
                  ]
                },
                {
                  "kind": "account",
                  "path": "mint"
                }
              ],
              "program": {
                "kind": "const",
                "value": [
                  140,
                  151,
                  37,
                  143,
                  78,
                  36,
                  137,
                  241,
                  187,
                  61,
                  16,
                  41,
                  20,
                  142,
                  13,
                  131,
                  11,
                  90,
                  19,
                  153,
                  218,
                  255,
                  16,
                  132,
                  4,
                  142,
                  123,
                  216,
                  219,
                  233,
                  248,
                  89
                ]
              }
            }
          },
          {
            "name": "referral",
            "writable": true
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          },
          {
            "name": "tokenProgram",
            "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          },
          {
            "name": "associatedTokenProgram",
            "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
          },
          {
            "name": "rent",
            "address": "SysvarRent111111111111111111111111111111111"
          },
          {
            "name": "eventAuthority",
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    95,
                    95,
                    101,
                    118,
                    101,
                    110,
                    116,
                    95,
                    97,
                    117,
                    116,
                    104,
                    111,
                    114,
                    105,
                    116,
                    121
                  ]
                }
              ]
            }
          },
          {
            "name": "program"
          }
        ],
        "args": [
          {
            "name": "marketCapIndex",
            "type": "u8"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "maxSolCost",
            "type": "u64"
          }
        ]
      },
      {
        "name": "create",
        "discriminator": [
          24,
          30,
          200,
          40,
          5,
          28,
          7,
          119
        ],
        "accounts": [
          {
            "name": "user",
            "writable": true,
            "signer": true
          },
          {
            "name": "global",
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    103,
                    108,
                    111,
                    98,
                    97,
                    108
                  ]
                }
              ]
            }
          },
          {
            "name": "marketCap",
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    109,
                    97,
                    114,
                    107,
                    101,
                    116,
                    95,
                    99,
                    97,
                    112
                  ]
                },
                {
                  "kind": "arg",
                  "path": "marketCapIndex"
                }
              ]
            }
          },
          {
            "name": "mint",
            "writable": true,
            "signer": true
          },
          {
            "name": "bondingCurve",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    98,
                    111,
                    110,
                    100,
                    105,
                    110,
                    103,
                    95,
                    99,
                    117,
                    114,
                    118,
                    101
                  ]
                },
                {
                  "kind": "account",
                  "path": "mint"
                }
              ]
            }
          },
          {
            "name": "associatedBondingCurve",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "account",
                  "path": "bondingCurve"
                },
                {
                  "kind": "const",
                  "value": [
                    6,
                    221,
                    246,
                    225,
                    215,
                    101,
                    161,
                    147,
                    217,
                    203,
                    225,
                    70,
                    206,
                    235,
                    121,
                    172,
                    28,
                    180,
                    133,
                    237,
                    95,
                    91,
                    55,
                    145,
                    58,
                    140,
                    245,
                    133,
                    126,
                    255,
                    0,
                    169
                  ]
                },
                {
                  "kind": "account",
                  "path": "mint"
                }
              ],
              "program": {
                "kind": "const",
                "value": [
                  140,
                  151,
                  37,
                  143,
                  78,
                  36,
                  137,
                  241,
                  187,
                  61,
                  16,
                  41,
                  20,
                  142,
                  13,
                  131,
                  11,
                  90,
                  19,
                  153,
                  218,
                  255,
                  16,
                  132,
                  4,
                  142,
                  123,
                  216,
                  219,
                  233,
                  248,
                  89
                ]
              }
            }
          },
          {
            "name": "metadata",
            "writable": true
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          },
          {
            "name": "tokenProgram",
            "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          },
          {
            "name": "tokenMetadataProgram",
            "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          },
          {
            "name": "associatedTokenProgram",
            "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
          },
          {
            "name": "rent",
            "address": "SysvarRent111111111111111111111111111111111"
          },
          {
            "name": "eventAuthority",
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    95,
                    95,
                    101,
                    118,
                    101,
                    110,
                    116,
                    95,
                    97,
                    117,
                    116,
                    104,
                    111,
                    114,
                    105,
                    116,
                    121
                  ]
                }
              ]
            }
          },
          {
            "name": "program"
          }
        ],
        "args": [
          {
            "name": "marketCapIndex",
            "type": "u8"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "aiGenerated",
            "type": "bool"
          }
        ]
      },
      {
        "name": "initialize",
        "discriminator": [
          175,
          175,
          109,
          31,
          13,
          152,
          155,
          237
        ],
        "accounts": [
          {
            "name": "admin",
            "writable": true,
            "signer": true
          },
          {
            "name": "global",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    103,
                    108,
                    111,
                    98,
                    97,
                    108
                  ]
                }
              ]
            }
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          },
          {
            "name": "rent",
            "address": "SysvarRent111111111111111111111111111111111"
          }
        ],
        "args": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "fee",
            "type": "f64"
          },
          {
            "name": "referralFee",
            "type": "f64"
          },
          {
            "name": "feeRecipient",
            "type": "pubkey"
          },
          {
            "name": "raydiumMigrator",
            "type": "pubkey"
          }
        ]
      },
      {
        "name": "sell",
        "discriminator": [
          51,
          230,
          133,
          164,
          1,
          127,
          131,
          173
        ],
        "accounts": [
          {
            "name": "user",
            "writable": true,
            "signer": true
          },
          {
            "name": "global",
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    103,
                    108,
                    111,
                    98,
                    97,
                    108
                  ]
                }
              ]
            }
          },
          {
            "name": "marketCap",
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    109,
                    97,
                    114,
                    107,
                    101,
                    116,
                    95,
                    99,
                    97,
                    112
                  ]
                },
                {
                  "kind": "arg",
                  "path": "marketCapIndex"
                }
              ]
            },
            "relations": [
              "bondingCurve"
            ]
          },
          {
            "name": "feeRecipient",
            "writable": true,
            "relations": [
              "global"
            ]
          },
          {
            "name": "mint",
            "writable": true
          },
          {
            "name": "bondingCurve",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    98,
                    111,
                    110,
                    100,
                    105,
                    110,
                    103,
                    95,
                    99,
                    117,
                    114,
                    118,
                    101
                  ]
                },
                {
                  "kind": "account",
                  "path": "mint"
                }
              ]
            }
          },
          {
            "name": "associatedBondingCurve",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "account",
                  "path": "bondingCurve"
                },
                {
                  "kind": "const",
                  "value": [
                    6,
                    221,
                    246,
                    225,
                    215,
                    101,
                    161,
                    147,
                    217,
                    203,
                    225,
                    70,
                    206,
                    235,
                    121,
                    172,
                    28,
                    180,
                    133,
                    237,
                    95,
                    91,
                    55,
                    145,
                    58,
                    140,
                    245,
                    133,
                    126,
                    255,
                    0,
                    169
                  ]
                },
                {
                  "kind": "account",
                  "path": "mint"
                }
              ],
              "program": {
                "kind": "const",
                "value": [
                  140,
                  151,
                  37,
                  143,
                  78,
                  36,
                  137,
                  241,
                  187,
                  61,
                  16,
                  41,
                  20,
                  142,
                  13,
                  131,
                  11,
                  90,
                  19,
                  153,
                  218,
                  255,
                  16,
                  132,
                  4,
                  142,
                  123,
                  216,
                  219,
                  233,
                  248,
                  89
                ]
              }
            }
          },
          {
            "name": "associatedUser",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "account",
                  "path": "user"
                },
                {
                  "kind": "const",
                  "value": [
                    6,
                    221,
                    246,
                    225,
                    215,
                    101,
                    161,
                    147,
                    217,
                    203,
                    225,
                    70,
                    206,
                    235,
                    121,
                    172,
                    28,
                    180,
                    133,
                    237,
                    95,
                    91,
                    55,
                    145,
                    58,
                    140,
                    245,
                    133,
                    126,
                    255,
                    0,
                    169
                  ]
                },
                {
                  "kind": "account",
                  "path": "mint"
                }
              ],
              "program": {
                "kind": "const",
                "value": [
                  140,
                  151,
                  37,
                  143,
                  78,
                  36,
                  137,
                  241,
                  187,
                  61,
                  16,
                  41,
                  20,
                  142,
                  13,
                  131,
                  11,
                  90,
                  19,
                  153,
                  218,
                  255,
                  16,
                  132,
                  4,
                  142,
                  123,
                  216,
                  219,
                  233,
                  248,
                  89
                ]
              }
            }
          },
          {
            "name": "referral",
            "writable": true
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          },
          {
            "name": "tokenProgram",
            "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          },
          {
            "name": "associatedTokenProgram",
            "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
          },
          {
            "name": "rent",
            "address": "SysvarRent111111111111111111111111111111111"
          },
          {
            "name": "eventAuthority",
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    95,
                    95,
                    101,
                    118,
                    101,
                    110,
                    116,
                    95,
                    97,
                    117,
                    116,
                    104,
                    111,
                    114,
                    105,
                    116,
                    121
                  ]
                }
              ]
            }
          },
          {
            "name": "program"
          }
        ],
        "args": [
          {
            "name": "marketCapIndex",
            "type": "u8"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "minSolOutput",
            "type": "u64"
          }
        ]
      },
      {
        "name": "updateConfig",
        "discriminator": [
          29,
          158,
          252,
          191,
          10,
          83,
          219,
          99
        ],
        "accounts": [
          {
            "name": "admin",
            "writable": true,
            "signer": true,
            "relations": [
              "global"
            ]
          },
          {
            "name": "global",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    103,
                    108,
                    111,
                    98,
                    97,
                    108
                  ]
                }
              ]
            }
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          }
        ],
        "args": [
          {
            "name": "newAdmin",
            "type": "pubkey"
          },
          {
            "name": "fee",
            "type": "f64"
          },
          {
            "name": "referralFee",
            "type": "f64"
          },
          {
            "name": "feeRecipient",
            "type": "pubkey"
          },
          {
            "name": "raydiumMigrator",
            "type": "pubkey"
          },
          {
            "name": "tokenDecimals",
            "type": "u8"
          }
        ]
      },
      {
        "name": "updateMarketCap",
        "discriminator": [
          156,
          26,
          59,
          174,
          248,
          194,
          240,
          85
        ],
        "accounts": [
          {
            "name": "admin",
            "writable": true,
            "signer": true,
            "relations": [
              "global"
            ]
          },
          {
            "name": "global",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    103,
                    108,
                    111,
                    98,
                    97,
                    108
                  ]
                }
              ]
            }
          },
          {
            "name": "marketCap",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    109,
                    97,
                    114,
                    107,
                    101,
                    116,
                    95,
                    99,
                    97,
                    112
                  ]
                },
                {
                  "kind": "arg",
                  "path": "index"
                }
              ]
            }
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          },
          {
            "name": "rent",
            "address": "SysvarRent111111111111111111111111111111111"
          }
        ],
        "args": [
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "totalSupply",
            "type": "u64"
          },
          {
            "name": "solReserves",
            "type": "u64"
          },
          {
            "name": "tokenReserves",
            "type": "u64"
          },
          {
            "name": "tokenLiquidity",
            "type": "u64"
          }
        ]
      },
      {
        "name": "withdraw",
        "discriminator": [
          183,
          18,
          70,
          156,
          148,
          109,
          161,
          34
        ],
        "accounts": [
          {
            "name": "raydiumMigrator",
            "writable": true,
            "signer": true,
            "relations": [
              "global"
            ]
          },
          {
            "name": "global",
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    103,
                    108,
                    111,
                    98,
                    97,
                    108
                  ]
                }
              ]
            }
          },
          {
            "name": "marketCap",
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    109,
                    97,
                    114,
                    107,
                    101,
                    116,
                    95,
                    99,
                    97,
                    112
                  ]
                },
                {
                  "kind": "arg",
                  "path": "marketCapIndex"
                }
              ]
            },
            "relations": [
              "bondingCurve"
            ]
          },
          {
            "name": "mint",
            "writable": true
          },
          {
            "name": "bondingCurve",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    98,
                    111,
                    110,
                    100,
                    105,
                    110,
                    103,
                    95,
                    99,
                    117,
                    114,
                    118,
                    101
                  ]
                },
                {
                  "kind": "account",
                  "path": "mint"
                }
              ]
            }
          },
          {
            "name": "associatedBondingCurve",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "account",
                  "path": "bondingCurve"
                },
                {
                  "kind": "const",
                  "value": [
                    6,
                    221,
                    246,
                    225,
                    215,
                    101,
                    161,
                    147,
                    217,
                    203,
                    225,
                    70,
                    206,
                    235,
                    121,
                    172,
                    28,
                    180,
                    133,
                    237,
                    95,
                    91,
                    55,
                    145,
                    58,
                    140,
                    245,
                    133,
                    126,
                    255,
                    0,
                    169
                  ]
                },
                {
                  "kind": "account",
                  "path": "mint"
                }
              ],
              "program": {
                "kind": "const",
                "value": [
                  140,
                  151,
                  37,
                  143,
                  78,
                  36,
                  137,
                  241,
                  187,
                  61,
                  16,
                  41,
                  20,
                  142,
                  13,
                  131,
                  11,
                  90,
                  19,
                  153,
                  218,
                  255,
                  16,
                  132,
                  4,
                  142,
                  123,
                  216,
                  219,
                  233,
                  248,
                  89
                ]
              }
            }
          },
          {
            "name": "associatedMigrator",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "account",
                  "path": "raydiumMigrator"
                },
                {
                  "kind": "const",
                  "value": [
                    6,
                    221,
                    246,
                    225,
                    215,
                    101,
                    161,
                    147,
                    217,
                    203,
                    225,
                    70,
                    206,
                    235,
                    121,
                    172,
                    28,
                    180,
                    133,
                    237,
                    95,
                    91,
                    55,
                    145,
                    58,
                    140,
                    245,
                    133,
                    126,
                    255,
                    0,
                    169
                  ]
                },
                {
                  "kind": "account",
                  "path": "mint"
                }
              ],
              "program": {
                "kind": "const",
                "value": [
                  140,
                  151,
                  37,
                  143,
                  78,
                  36,
                  137,
                  241,
                  187,
                  61,
                  16,
                  41,
                  20,
                  142,
                  13,
                  131,
                  11,
                  90,
                  19,
                  153,
                  218,
                  255,
                  16,
                  132,
                  4,
                  142,
                  123,
                  216,
                  219,
                  233,
                  248,
                  89
                ]
              }
            }
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          },
          {
            "name": "tokenProgram",
            "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          },
          {
            "name": "associatedTokenProgram",
            "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
          },
          {
            "name": "rent",
            "address": "SysvarRent111111111111111111111111111111111"
          }
        ],
        "args": [
          {
            "name": "marketCapIndex",
            "type": "u8"
          }
        ]
      }
    ],
    "accounts": [
      {
        "name": "bondingCurve",
        "discriminator": [
          23,
          183,
          248,
          55,
          96,
          216,
          172,
          96
        ]
      },
      {
        "name": "global",
        "discriminator": [
          167,
          232,
          232,
          177,
          200,
          108,
          114,
          127
        ]
      },
      {
        "name": "marketCap",
        "discriminator": [
          182,
          231,
          202,
          165,
          75,
          159,
          248,
          8
        ]
      }
    ],
    "events": [
      {
        "name": "createEvent",
        "discriminator": [
          27,
          114,
          169,
          77,
          222,
          235,
          99,
          118
        ]
      },
      {
        "name": "swapEvent",
        "discriminator": [
          64,
          198,
          205,
          232,
          38,
          8,
          113,
          226
        ]
      }
    ],
    "errors": [
      {
        "code": 6000,
        "name": "invalidMintAuthority",
        "msg": "Invalid mint authority"
      },
      {
        "code": 6001,
        "name": "invalidAmount",
        "msg": "Invalid amount"
      },
      {
        "code": 6002,
        "name": "tooMuchSolRequired",
        "msg": "slippage: Too much SOL required to buy the given amount of tokens.."
      },
      {
        "code": 6003,
        "name": "solReturnedNotEnough",
        "msg": "slippage: Not enough SOL returned to sell the given amount of tokens.."
      },
      {
        "code": 6004,
        "name": "bondingCurveComplete",
        "msg": "The bonding curve has completed and liquidity migrated to raydium.."
      },
      {
        "code": 6005,
        "name": "bondingCurveNotComplete",
        "msg": "The bonding curve has not completed yet"
      },
      {
        "code": 6006,
        "name": "invalidMarketCapIndex",
        "msg": "Invalid market cap index"
      }
    ],
    "types": [
      {
        "name": "bondingCurve",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "bump",
              "type": "u8"
            },
            {
              "name": "marketCap",
              "type": "pubkey"
            },
            {
              "name": "reserveSol",
              "type": "u64"
            },
            {
              "name": "reserveToken",
              "type": "u64"
            },
            {
              "name": "completed",
              "type": "bool"
            }
          ]
        }
      },
      {
        "name": "createEvent",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "name",
              "type": "string"
            },
            {
              "name": "symbol",
              "type": "string"
            },
            {
              "name": "uri",
              "type": "string"
            },
            {
              "name": "mint",
              "type": "pubkey"
            },
            {
              "name": "bondingCurve",
              "type": "pubkey"
            },
            {
              "name": "user",
              "type": "pubkey"
            },
            {
              "name": "marketCap",
              "type": "pubkey"
            },
            {
              "name": "aiGenerated",
              "type": "bool"
            }
          ]
        }
      },
      {
        "name": "global",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "bump",
              "type": "u8"
            },
            {
              "name": "admin",
              "type": "pubkey"
            },
            {
              "name": "fee",
              "type": "f64"
            },
            {
              "name": "referralFee",
              "type": "f64"
            },
            {
              "name": "feeRecipient",
              "type": "pubkey"
            },
            {
              "name": "raydiumMigrator",
              "type": "pubkey"
            },
            {
              "name": "defaultTokenDecimals",
              "type": "u8"
            }
          ]
        }
      },
      {
        "name": "marketCap",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "bump",
              "type": "u8"
            },
            {
              "name": "index",
              "type": "u8"
            },
            {
              "name": "defaultTotalSupply",
              "type": "u64"
            },
            {
              "name": "defaultSolReserves",
              "type": "u64"
            },
            {
              "name": "defaultTokenReserves",
              "type": "u64"
            },
            {
              "name": "defaultTokenLiquidity",
              "type": "u64"
            }
          ]
        }
      },
      {
        "name": "swapEvent",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "mint",
              "type": "pubkey"
            },
            {
              "name": "solAmount",
              "type": "u64"
            },
            {
              "name": "tokenAmount",
              "type": "u64"
            },
            {
              "name": "isBuy",
              "type": "bool"
            },
            {
              "name": "user",
              "type": "pubkey"
            },
            {
              "name": "timestamp",
              "type": "i64"
            },
            {
              "name": "virtualSolReserves",
              "type": "u64"
            },
            {
              "name": "virtualTokenReserves",
              "type": "u64"
            },
            {
              "name": "referral",
              "type": "pubkey"
            }
          ]
        }
      }
    ]
  };