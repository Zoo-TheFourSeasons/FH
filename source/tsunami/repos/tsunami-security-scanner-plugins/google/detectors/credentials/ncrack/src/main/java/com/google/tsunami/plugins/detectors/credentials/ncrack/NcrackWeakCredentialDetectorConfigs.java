/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.tsunami.plugins.detectors.credentials.ncrack;

import com.google.tsunami.common.config.annotations.ConfigProperties;
import com.google.tsunami.plugins.detectors.credentials.ncrack.client.NcrackClient.TargetService;
import java.util.List;

@ConfigProperties("plugins.google.detectors.credentials.ncrack")
final class NcrackWeakCredentialDetectorConfigs {
  // Path to the ncrack binary.
  String ncrackBinaryPath;

  /** String value of {@link TargetService} to exclude from ncrack scanning. */
  List<String> excludedTargetServices;
}
